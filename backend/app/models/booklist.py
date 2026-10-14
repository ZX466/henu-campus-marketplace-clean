from typing import Optional

from pydantic import BaseModel, Field


class BookListItem(BaseModel):
    """A verified starter book-list entry.

    We intentionally do not expose an edition field: the rule-based starter
    list must not claim a textbook edition that has not been verified.
    """

    id: str
    title: str
    course: str
    majors: list[str] = Field(default_factory=list)
    grades: list[str] = Field(default_factory=list)
    campuses: list[str] = Field(default_factory=list)
    description: str = ""


class BookListQuery(BaseModel):
    major: Optional[str] = None
    course: Optional[str] = None
    campus: Optional[str] = None
