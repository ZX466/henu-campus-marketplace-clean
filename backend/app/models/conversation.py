"""私信会话数据模型。

一个会话 = 某个商品（product）或跑腿任务（errand）+ 两位用户。
同一目标 + 同一对用户只会有一个会话，重复发起时复用原会话。

MongoDB 集合：conversations
{
    "_id": ObjectId,
    "target_type": "product" | "errand",
    "target_id": "商品 id 或 task_id",
    "target_title": "高等数学（同济第七版）",      # 创建时的快照，商品下架后仍可显示
    "participants": ["user_a_id", "user_b_id"],    # 已排序
    "participant_key": "user_a_id:user_b_id",      # 用于去重的唯一键
    "created_by": "发起人 id",
    "last_message": {"sender_id": ..., "content": ..., "created_at": ...} | None,
    "unread_counts": {"user_a_id": 0, "user_b_id": 2},
    "created_at": "ISO 时间",
    "updated_at": "ISO 时间"
}
唯一索引：(target_type, target_id, participant_key)
"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

TargetType = Literal["product", "errand"]


class ConversationCreate(BaseModel):
    model_config = {"extra": "ignore"}

    target_type: TargetType = Field(
        ...,
        description="会话关联对象：product = 二手商品，errand = 跑腿任务",
        examples=["product"],
    )
    target_id: str = Field(
        ...,
        min_length=1,
        description="商品 id 或跑腿任务 task_id",
        examples=["6650f0c2a1b2c3d4e5f60718"],
    )
    peer_id: Optional[str] = Field(
        default=None,
        description=(
            "对方用户 id。可不传：后端会自动取商品的 sellerId 或任务的 creator_id。"
            "卖家/发布者主动联系买家/接单人时必须传。"
        ),
        examples=[None],
    )


class LastMessage(BaseModel):
    sender_id: str
    content: str
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    target_type: TargetType
    target_id: str
    target_title: Optional[str] = None
    participants: List[str]
    peer_id: str = Field(..., description="对当前用户而言的对方 id")
    created_by: str
    last_message: Optional[LastMessage] = None
    unread_count: int = Field(0, description="当前用户在该会话的未读消息数")
    created_at: str
    updated_at: str


class ConversationCreateResponse(ConversationResponse):
    created: bool = Field(..., description="true = 新建会话；false = 复用已有会话")


def participant_key(user_a: str, user_b: str) -> str:
    return ":".join(sorted([str(user_a), str(user_b)]))


def to_conversation_response(doc: dict, current_user_id: str) -> dict:
    """把 MongoDB 文档转成面向当前用户的响应。"""
    participants: List[str] = list(doc.get("participants", []))
    peer_id = next((p for p in participants if p != current_user_id), current_user_id)
    unread: Dict[str, int] = doc.get("unread_counts") or {}
    return {
        "id": str(doc["_id"]),
        "target_type": doc["target_type"],
        "target_id": doc["target_id"],
        "target_title": doc.get("target_title"),
        "participants": participants,
        "peer_id": peer_id,
        "created_by": doc.get("created_by", ""),
        "last_message": doc.get("last_message"),
        "unread_count": int(unread.get(current_user_id, 0)),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }
