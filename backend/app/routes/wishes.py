import re

from fastapi import APIRouter

from app.models.wish import WishParseRequest, WishParseResponse


router = APIRouter(
    prefix="/api/v1/wishes",
    tags=["Book Wishes"],
)

REQUIRED_FIELDS = ("major", "grade", "course", "budget_max", "campus")
KNOWN_MAJORS = (
    "软件工程",
    "计算机科学与技术",
    "临床医学",
    "汉语言文学",
    "法学",
    "经济学",
    "工商管理",
    "数学与应用数学",
    "信息管理与信息系统",
    "电子信息工程",
)
KNOWN_COURSES = (
    "数据库原理",
    "高等数学",
    "线性代数",
    "大学英语",
    "软件工程",
    "操作系统",
    "计算机网络",
    "概率论",
    "Python程序设计",
    "Java程序设计",
    "Web开发",
)


def _first_known(text: str, values: tuple[str, ...]) -> str | None:
    for value in values:
        if value.lower() in text.lower():
            return value
    return None


def _parse_grade(text: str) -> str | None:
    match = re.search(r"((?:19|20)\d{2}\s*级)", text)
    if match:
        return re.sub(r"\s+", "", match.group(1))
    match = re.search(r"(大[一二三四])", text)
    return match.group(1) if match else None


def _parse_course(text: str) -> str | None:
    known = _first_known(text, KNOWN_COURSES)
    if known:
        return known
    match = re.search(r"(?:买|想买|需要|求购|寻找)\s*([^，,。；;]{2,30}?)(?:教材|课本|书)", text)
    if match:
        value = match.group(1).strip()
        return value or None
    return None


def _parse_budget(text: str) -> float | None:
    patterns = (
        r"(?:预算|最多|不超过|最高)\s*(?:约|为|是)?\s*(\d+(?:\.\d+)?)\s*(?:元|块)?",
        r"(\d+(?:\.\d+)?)\s*(?:元|块)\s*(?:以内|以下|左右)",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return None


def _parse_campus(text: str) -> str | None:
    if "金明" in text:
        return "金明校区"
    if "明伦" in text:
        return "明伦校区"
    return None


def parse_wish_text(text: str) -> WishParseResponse:
    values = {
        "major": _first_known(text, KNOWN_MAJORS),
        "grade": _parse_grade(text),
        "course": _parse_course(text),
        "budget_max": _parse_budget(text),
        "campus": _parse_campus(text),
    }
    missing_fields = [field for field in REQUIRED_FIELDS if values[field] is None]
    return WishParseResponse(**values, missing_fields=missing_fields, need_confirm=True)


@router.post("/parse", response_model=WishParseResponse)
async def parse_wish(request: WishParseRequest):
    """Parse a book-buying request with deterministic local rules only."""

    return parse_wish_text(request.text)
