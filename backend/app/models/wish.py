from typing import Optional

from pydantic import BaseModel, Field


class WishParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class WishParseResponse(BaseModel):
    major: Optional[str] = None
    grade: Optional[str] = None
    course: Optional[str] = None
    budget_max: Optional[float] = None
    campus: Optional[str] = None
    missing_fields: list[str] = Field(default_factory=list)
    need_confirm: bool = True
