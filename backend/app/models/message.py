"""私信消息数据模型。

MongoDB 集合：messages
{
    "_id": ObjectId,
    "conversation_id": "所属会话 id",
    "sender_id": "发送人 id",
    "type": "text",                 # 今天只支持文字
    "content": "这本书还在吗？",
    "read": false,                  # 接收方是否已读（双人会话）
    "read_at": "ISO 时间" | None,
    "created_at": "ISO 时间"
}
索引：(conversation_id, created_at)
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

MAX_MESSAGE_LENGTH = 1000


class MessageCreate(BaseModel):
    model_config = {"extra": "ignore"}

    content: str = Field(
        ...,
        description=f"文字内容，去掉首尾空格后 1~{MAX_MESSAGE_LENGTH} 字",
        examples=["同学你好，这本高数教材还在吗？"],
    )

    @field_validator("content")
    @classmethod
    def strip_and_check(cls, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise ValueError("消息内容不能为空")
        if len(value) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"消息内容不能超过 {MAX_MESSAGE_LENGTH} 字")
        return value


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    type: Literal["text"] = "text"
    content: str
    read: bool = False
    read_at: Optional[str] = None
    created_at: str
    is_mine: bool = Field(False, description="是否为当前用户发送，方便前端左右气泡布局")


class MessageListResponse(BaseModel):
    conversation_id: str
    items: List[MessageResponse]
    has_more: bool = Field(False, description="是否还有更早的消息，可用 before 参数继续加载")


class MarkReadResponse(BaseModel):
    conversation_id: str
    marked_count: int = Field(..., description="本次被标记为已读的消息条数")
    unread_count: int = 0


def to_message_response(doc: dict, current_user_id: str) -> dict:
    return {
        "id": str(doc["_id"]),
        "conversation_id": doc["conversation_id"],
        "sender_id": doc["sender_id"],
        "type": doc.get("type", "text"),
        "content": doc["content"],
        "read": bool(doc.get("read", False)),
        "read_at": doc.get("read_at"),
        "created_at": doc["created_at"],
        "is_mine": doc["sender_id"] == current_user_id,
    }
