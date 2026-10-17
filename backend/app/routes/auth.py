import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Response, status, Depends, Request
from bson import ObjectId

from app.core.auth import (
    get_current_user,
    create_session_token,
    hash_password,
    verify_password,
)
from app.core.mongodb import get_database
from app.core.errors import ApiError
from app.models.auth import (
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    AuthResponse,
    UserProfile,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication & Student Access"],
)

logger = logging.getLogger("campuscart.auth")


def derive_student_details(email: str):
    prefix = email.split("@")[0] if "@" in email else email
    roll = prefix.upper()

    name = (
        "Aarav Patel"
        if "2024CS1089" in roll
        else f"Student {roll}"
    )

    dept = "Computer Science & Engineering"
    campus = "河南大学金明校区"
    hostel = "校园宿舍"

    return roll, name, dept, campus, hostel


def serialize_user(doc: dict) -> UserProfile:
    user_id = str(doc.get("_id", doc.get("id", "")))
    email = doc.get("email", "")

    roll = doc.get(
        "roll",
        email.split("@")[0].upper() if email else "STUDENT",
    )

    name = doc.get("name", "Verified Student")

    dept = doc.get(
        "department",
        doc.get("dept", "Computer Science & Engineering"),
    )

    campus = doc.get(
        "campus",
        "河南大学金明校区",
    )

    hostel = doc.get(
        "hostel",
        "Campus Residence",
    )

    verified = doc.get("verified", True)
    trust_score = doc.get("trustScore", 98)
    legacy_password_pending = doc.get("legacy_password_pending", False)

    created_at = doc.get("created_at")
    last_login = doc.get("last_login")

    return UserProfile(
        id=user_id,
        email=email,
        roll=roll,
        name=name,
        department=dept,
        dept=dept,
        campus=campus,
        hostel=hostel,
        verified=verified,
        trustScore=trust_score,
        legacy_password_pending=legacy_password_pending,
        created_at=created_at,
        last_login=last_login,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Student Login & Session Token",
)
async def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
):
    """
    Authenticate a student user.

    Only accounts that already exist in MongoDB can log in.
    Unregistered emails and wrong passwords are rejected.
    """

    email = payload.email.strip().lower()

    if not email:
        raise ApiError(400, "邮箱不能为空。", code="AUTH_EMAIL_REQUIRED")

    if not payload.password:
        raise ApiError(400, "密码不能为空。", code="AUTH_PASSWORD_REQUIRED")

    roll, *_ = derive_student_details(email)

    now = datetime.utcnow().isoformat()

    try:
        db = get_database()
        user_doc = await db["users"].find_one({"email": email})
    except Exception:
        logger.exception("Login failed: user service unavailable")
        raise ApiError(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "用户服务暂时不可用，请稍后再试。",
            code="AUTH_SERVICE_UNAVAILABLE",
        )

    # 未注册的账号不允许登录（不再自动创建账号）
    if not user_doc:
        raise ApiError(
            status.HTTP_401_UNAUTHORIZED,
            "该邮箱尚未注册，请先注册后再登录。",
            code="AUTH_UNREGISTERED",
        )

    stored_hash = user_doc.get("password_hash")

    # 强制校验密码，任何不匹配都拒绝登录
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise ApiError(
            status.HTTP_401_UNAUTHORIZED,
            "邮箱或密码错误。",
            code="AUTH_INVALID_CREDENTIALS",
        )

    try:
        await db["users"].update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login": now, "updated_at": now}},
        )
    except Exception:
        pass

    user_doc["last_login"] = now

    user_profile = serialize_user(user_doc)

    token = create_session_token(
        str(user_profile.id),
        user_profile.email,
        user_profile.name,
    )

    is_https = request.url.scheme == "https"

    response.set_cookie(
        key="campuscart_session",
        value=token,
        max_age=60 * 60 * 24 * 7,
        httponly=True,
        secure=is_https,
        samesite="none" if is_https else "lax",
        path="/",
    )

    return LoginResponse(
        success=True,
        token=token,
        message=f"Successfully authenticated as {roll}",
        user=user_profile,
    )


@router.post(
    "/register",
    response_model=LoginResponse,
    summary="Register New Student Account",
)
async def register(
    req: RegisterRequest,
    response: Response,
    request: Request,
):
    """Register a new student account in MongoDB Atlas.

    If the email belongs to a legacy auto-created account (flagged by
    migrate_legacy_accounts.py), this doubles as account recovery:
    the password is reset and the legacy flag is cleared.
    """

    email = req.email.strip().lower()

    if not email:
        raise ApiError(400, "邮箱不能为空。", code="AUTH_EMAIL_REQUIRED")

    if not req.password:
        raise ApiError(400, "注册密码不能为空。", code="AUTH_PASSWORD_REQUIRED")

    roll, name, dept, campus, hostel = derive_student_details(email)

    now = datetime.utcnow().isoformat()

    try:
        db = get_database()

        existing = await db["users"].find_one(
            {"email": email}
        )

        # 历史遗留账号（早期自动创建、密码无人知道）：
        # 允许在注册页用同一个邮箱重设密码完成"认领"
        if existing and existing.get("legacy_password_pending"):
            existing.update(
                {
                    "password_hash": hash_password(req.password),
                    "name": req.name or existing.get("name") or name,
                    "roll": req.roll or existing.get("roll") or roll,
                    "department": (
                        req.department or existing.get("department") or dept
                    ),
                    "dept": req.department or existing.get("department") or dept,
                    "campus": req.campus or existing.get("campus") or campus,
                    "legacy_password_pending": False,
                    "last_login": now,
                    "updated_at": now,
                }
            )

            update_fields = {
                key: value
                for key, value in existing.items()
                if key != "_id"
            }

            await db["users"].update_one(
                {"_id": existing["_id"]},
                {"$set": update_fields},
            )

            user_doc = existing
            message = "账号认领成功，新密码已生效。"

        elif existing:
            raise ApiError(
                400,
                "该邮箱已注册，请直接登录。",
                code="AUTH_EMAIL_TAKEN",
            )

        else:
            user_data = {
                "email": email,
                "roll": req.roll or roll,
                "name": req.name or name,
                "department": req.department or dept,
                "dept": req.department or dept,
                "campus": req.campus or campus,
                "hostel": hostel,
                "password_hash": hash_password(req.password),
                "verified": True,
                "trustScore": 99,
                "created_at": now,
                "last_login": now,
                "updated_at": now,
            }

            result = await db["users"].insert_one(user_data)

            user_data["_id"] = result.inserted_id

            user_doc = user_data
            message = "注册成功，欢迎加入河大同享！"

        user_profile = serialize_user(user_doc)

        token = create_session_token(
            str(user_profile.id),
            user_profile.email,
            user_profile.name,
        )

        is_https = request.url.scheme == "https"

        response.set_cookie(
            key="campuscart_session",
            value=token,
            max_age=60 * 60 * 24 * 7,
            httponly=True,
            secure=is_https,
            samesite="none" if is_https else "lax",
            path="/",
        )

        return LoginResponse(
            success=True,
            token=token,
            message=message,
            user=user_profile,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Registration failed")
        raise ApiError(
            500,
            "注册失败，请稍后再试。",
            code="AUTH_REGISTER_FAILED",
        )


@router.get(
    "/me",
    response_model=AuthResponse,
)
async def me(
    current=Depends(get_current_user),
):
    try:
        db = get_database()

        user_id = current.get("sub", "")

        if ObjectId.is_valid(user_id):
            query = {"_id": ObjectId(user_id)}
        else:
            query = {
                "email": current.get("email")
            }

        user = await db["users"].find_one(query)

    except Exception:
        user = None

    if not user:
        # 账号不存在（未注册或已注销）→ 会话失效，必须重新登录
        raise ApiError(
            status.HTTP_401_UNAUTHORIZED,
            "账号不存在或会话已失效，请重新登录。",
            code="AUTH_SESSION_INVALID",
        )

    return AuthResponse(
        success=True,
        user=serialize_user(user),
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="campuscart_session",
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
    )

    return {
        "message": "Logged out successfully"
    }
