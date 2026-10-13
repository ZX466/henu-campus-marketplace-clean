"""私信接口（最小闭环）：创建/复用会话 → 发送文字 → 查看历史 → 标记已读。

权限规则：
- 所有接口都需要登录（Cookie campuscart_session 或 Authorization: Bearer <token>）；
- 只有会话参与者可以查看、发送、标记已读，其他人一律 403；
- 同一目标（商品/跑腿任务）+ 同一对用户重复发起时复用原会话；
- 会话和消息不随商品下架、任务完成而删除，历史一直保留。

今天不做：WebSocket 实时推送、图片消息、群聊。
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from app.core.auth import get_current_user
from app.core.mongodb import get_database
from app.models.conversation import (
    ConversationCreate,
    ConversationCreateResponse,
    ConversationResponse,
    participant_key,
    to_conversation_response,
)
from app.models.message import (
    MarkReadResponse,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
    to_message_response,
)

router = APIRouter(
    prefix="/api/v1/conversations",
    tags=["Conversations & Messages"],
)

CONVERSATIONS = "conversations"
MESSAGES = "messages"

_indexes_ready = False


# ============================================================================
# HELPERS
# ============================================================================

def _now() -> str:
    return datetime.utcnow().isoformat()


async def _ensure_indexes(db) -> None:
    """首次调用时建索引；唯一索引保证并发重复发起也只会有一个会话。"""
    global _indexes_ready
    if _indexes_ready:
        return
    await db[CONVERSATIONS].create_index(
        [("target_type", 1), ("target_id", 1), ("participant_key", 1)],
        unique=True,
        name="uniq_target_pair",
    )
    await db[CONVERSATIONS].create_index([("participants", 1), ("updated_at", -1)])
    await db[MESSAGES].create_index([("conversation_id", 1), ("created_at", -1)])
    _indexes_ready = True


def _id_filter(raw_id: str, legacy_field: str = "id") -> dict:
    """兼容 ObjectId 和字符串 id（与 products.py 的写法一致）。"""
    ors = [{legacy_field: raw_id}, {"_id": raw_id}]
    if ObjectId.is_valid(raw_id):
        ors.insert(0, {"_id": ObjectId(raw_id)})
    return {"$or": ors}


async def _find_target(db, target_type: str, target_id: str) -> Optional[dict]:
    """查找商品或跑腿任务，返回 {owner_id, title}；找不到返回 None。"""
    if target_type == "product":
        doc = await db["products"].find_one(_id_filter(target_id))
        if not doc:
            return None
        return {"owner_id": doc.get("sellerId"), "title": doc.get("title")}

    # errand：字段遵循 docs/api-contract.md（task_id / creator_id / title）
    doc = await db["errands"].find_one(_id_filter(target_id, legacy_field="task_id"))
    if not doc:
        return None
    return {"owner_id": doc.get("creator_id"), "title": doc.get("title")}


async def _user_exists(db, user_id: str) -> bool:
    return bool(await db["users"].find_one(_id_filter(user_id), {"_id": 1}))


async def _get_conversation_for_member(db, conversation_id: str, user_id: str) -> dict:
    """取会话并校验参与者身份：不存在 → 404；不是参与者 → 403。"""
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="会话不存在")
    conv = await db[CONVERSATIONS].find_one({"_id": ObjectId(conversation_id)})
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if user_id not in conv.get("participants", []):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="你不是该会话的参与者，无权访问")
    return conv


# ============================================================================
# 1. 我的会话列表
# GET /api/v1/conversations
# ============================================================================

@router.get("", response_model=list[ConversationResponse], summary="我的会话列表")
async def list_conversations(
    target_type: Optional[str] = Query(None, description="按 product / errand 过滤"),
    target_id: Optional[str] = Query(None, description="按商品 id / 任务 id 过滤"),
    current=Depends(get_current_user),
):
    """只返回当前用户参与的会话，按最近消息时间倒序。"""
    db = get_database()
    user_id = str(current["sub"])

    query: dict = {"participants": user_id}
    if target_type:
        query["target_type"] = target_type
    if target_id:
        query["target_id"] = target_id

    cursor = db[CONVERSATIONS].find(query).sort("updated_at", -1).limit(100)
    return [to_conversation_response(doc, user_id) async for doc in cursor]


# ============================================================================
# 2. 发起会话（重复发起时复用）
# POST /api/v1/conversations
# ============================================================================

@router.post(
    "",
    response_model=ConversationCreateResponse,
    summary="针对商品/跑腿任务发起私信",
)
async def create_conversation(payload: ConversationCreate, current=Depends(get_current_user)):
    """
    - 买家联系卖家：只传 `target_type` + `target_id`，对方自动取商品 `sellerId` / 任务 `creator_id`；
    - 卖家联系买家：还需传 `peer_id`；
    - 同一目标 + 同一对用户已存在会话时直接返回原会话（`created=false`）。
    """
    db = get_database()
    await _ensure_indexes(db)
    user_id = str(current["sub"])

    target = await _find_target(db, payload.target_type, payload.target_id)
    owner_id = str(target["owner_id"]) if target and target.get("owner_id") else None

    peer_id = payload.peer_id or owner_id
    if not peer_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="无法确定对方用户：目标不存在或没有发布者，请传 peer_id",
        )
    peer_id = str(peer_id)
    if peer_id == user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="不能和自己发起私信")

    # 目标有发布者时，会话双方必须有一方是发布者，防止两个路人借商品名义互聊
    if owner_id and owner_id not in (user_id, peer_id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="该商品/任务的私信必须有发布者参与",
        )

    if not await _user_exists(db, peer_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="对方用户不存在")

    pair_key = participant_key(user_id, peer_id)
    now = _now()
    selector = {
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "participant_key": pair_key,
    }
    new_doc = {
        **selector,
        "target_title": target.get("title") if target else None,
        "participants": sorted([user_id, peer_id]),
        "created_by": user_id,
        "last_message": None,
        "unread_counts": {user_id: 0, peer_id: 0},
        "created_at": now,
        "updated_at": now,
    }

    # upsert + $setOnInsert：已存在则什么都不改，不存在则插入，一步完成
    created = False
    try:
        res = await db[CONVERSATIONS].update_one(
            selector,
            {"$setOnInsert": new_doc},
            upsert=True,
        )
        created = res.upserted_id is not None
    except DuplicateKeyError:
        # 两个请求同时插入，唯一索引拦下其中一个，按“复用”处理
        created = False
    conv = await db[CONVERSATIONS].find_one(selector)

    result = to_conversation_response(conv, user_id)
    result["created"] = created
    return result


# ============================================================================
# 3. 查看历史消息
# GET /api/v1/conversations/{conversation_id}/messages
# ============================================================================

@router.get(
    "/{conversation_id}/messages",
    response_model=MessageListResponse,
    summary="查看会话历史消息",
)
async def list_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100, description="每次最多返回条数"),
    before: Optional[str] = Query(None, description="加载更早消息：传当前最早一条的 created_at"),
    current=Depends(get_current_user),
):
    """按时间正序返回（旧 → 新），默认最近 50 条。仅会话参与者可调用。"""
    db = get_database()
    user_id = str(current["sub"])
    await _get_conversation_for_member(db, conversation_id, user_id)

    query: dict = {"conversation_id": conversation_id}
    if before:
        query["created_at"] = {"$lt": before}

    cursor = db[MESSAGES].find(query).sort("created_at", -1).limit(limit + 1)
    docs = [doc async for doc in cursor]
    has_more = len(docs) > limit
    docs = list(reversed(docs[:limit]))

    return {
        "conversation_id": conversation_id,
        "items": [to_message_response(d, user_id) for d in docs],
        "has_more": has_more,
    }


# ============================================================================
# 4. 发送文字消息
# POST /api/v1/conversations/{conversation_id}/messages
# ============================================================================

@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="发送文字消息",
)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current=Depends(get_current_user),
):
    """仅会话参与者可发送。发送后对方未读数 +1，会话移到列表顶部。"""
    db = get_database()
    user_id = str(current["sub"])
    conv = await _get_conversation_for_member(db, conversation_id, user_id)

    now = _now()
    msg = {
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "type": "text",
        "content": payload.content,
        "read": False,
        "read_at": None,
        "created_at": now,
    }
    inserted = await db[MESSAGES].insert_one(msg)
    msg["_id"] = inserted.inserted_id

    update: dict = {
        "$set": {
            "last_message": {"sender_id": user_id, "content": payload.content, "created_at": now},
            "updated_at": now,
        }
    }
    peers = [p for p in conv["participants"] if p != user_id]
    if peers:
        update["$inc"] = {f"unread_counts.{p}": 1 for p in peers}
    await db[CONVERSATIONS].update_one({"_id": conv["_id"]}, update)

    return to_message_response(msg, user_id)


# ============================================================================
# 5. 标记已读
# POST /api/v1/conversations/{conversation_id}/read
# ============================================================================

@router.post(
    "/{conversation_id}/read",
    response_model=MarkReadResponse,
    summary="把对方发来的消息标记为已读",
)
async def mark_conversation_read(conversation_id: str, current=Depends(get_current_user)):
    """把该会话中对方发给我的未读消息全部标为已读，并把我的未读数清零。"""
    db = get_database()
    user_id = str(current["sub"])
    conv = await _get_conversation_for_member(db, conversation_id, user_id)

    now = _now()
    result = await db[MESSAGES].update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user_id}, "read": False},
        {"$set": {"read": True, "read_at": now}},
    )
    await db[CONVERSATIONS].update_one(
        {"_id": conv["_id"]},
        {"$set": {f"unread_counts.{user_id}": 0}},
    )

    return {
        "conversation_id": conversation_id,
        "marked_count": result.modified_count,
        "unread_count": 0,
    }
