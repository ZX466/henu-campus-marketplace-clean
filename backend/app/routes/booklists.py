from fastapi import APIRouter, Query

from app.models.booklist import BookListItem


router = APIRouter(
    prefix="/api/v1/booklists",
    tags=["Book Lists"],
)


# Keep this list deliberately small and verifiable. No unverified textbook
# editions, ISBNs, prices, or stock are invented here.
BOOK_LIST: list[BookListItem] = [
    BookListItem(
        id="book-database-principles",
        title="数据库原理教材",
        course="数据库原理",
        majors=["软件工程", "计算机科学与技术"],
        grades=["2024级", "2025级"],
        campuses=["金明校区", "明伦校区"],
        description="数据库原理课程教材需求入口，版本由买卖双方确认。",
    ),
    BookListItem(
        id="book-linear-algebra",
        title="线性代数教材",
        course="线性代数",
        majors=["软件工程", "计算机科学与技术", "数学与应用数学"],
        grades=["2024级", "2025级"],
        campuses=["金明校区", "明伦校区"],
        description="线性代数课程教材需求入口，版本由买卖双方确认。",
    ),
    BookListItem(
        id="book-college-english",
        title="大学英语教材",
        course="大学英语",
        majors=[],
        grades=["2024级", "2025级"],
        campuses=["金明校区", "明伦校区"],
        description="大学英语课程教材需求入口，版本由买卖双方确认。",
    ),
]


@router.get("", response_model=list[BookListItem])
async def list_booklists(
    major: str | None = Query(None, description="按专业筛选"),
    course: str | None = Query(None, description="按课程筛选"),
    campus: str | None = Query(None, description="按校区筛选"),
):
    """Return the small verified starter book list.

    Filters are case-insensitive for convenience. An empty result is valid and
    means that no starter entry matches the requested filters.
    """

    def contains(values: list[str], value: str | None) -> bool:
        return not value or any(value.lower() in item.lower() for item in values)

    return [
        item
        for item in BOOK_LIST
        if contains(item.majors, major)
        and contains([item.course], course)
        and contains(item.campuses, campus)
    ]
