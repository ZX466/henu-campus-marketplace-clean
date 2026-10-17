from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    model_config = {"extra": "ignore"}

    email: str = Field(
        ...,
        examples=["2024xxxx@henu.edu.cn"],
        description="河南大学学生邮箱",
    )

    password: str = Field(
        ...,
        examples=["********"],
        description="登录密码（必填）",
    )


class RegisterRequest(BaseModel):
    model_config = {"extra": "ignore"}

    email: str = Field(..., examples=["2024xxxx@henu.edu.cn"])

    password: str = Field(..., examples=["********"])

    name: Optional[str] = Field(default="张同学", examples=["张同学"])

    roll: Optional[str] = Field(default="2024CS1089", examples=["2024CS1089"])

    department: Optional[str] = Field(
        default="计算机科学与技术学院",
        examples=["计算机科学与技术学院"],
    )

    campus: Optional[str] = Field(
        default="河南大学金明校区",
        examples=["河南大学金明校区"],
    )


class UserProfile(BaseModel):
    model_config = {"extra": "ignore"}

    id: Optional[str] = None

    email: str

    roll: str

    name: str

    department: Optional[str] = "计算机科学与技术学院"

    dept: Optional[str] = "计算机科学与技术学院"

    campus: Optional[str] = "河南大学金明校区"

    hostel: Optional[str] = "校园宿舍"

    verified: bool = True

    trustScore: int = 98

    # True 表示该账号是历史自动创建、密码待认领重设
    legacy_password_pending: bool = False

    created_at: Optional[str] = None

    last_login: Optional[str] = None


class UserResponse(UserProfile):
    pass


class LoginResponse(BaseModel):
    model_config = {"extra": "ignore"}

    success: bool = True

    token: str

    token_type: str = "bearer"

    message: str = "登录成功"

    user: UserProfile


class AuthResponse(BaseModel):
    model_config = {"extra": "ignore"}

    success: bool = True

    user: UserProfile

    token: Optional[str] = None
