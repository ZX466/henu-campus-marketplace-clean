from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SellerInfo(BaseModel):
    model_config = {"extra": "ignore"}

    name: str = "校园同学"

    email: Optional[str] = "senior@henu.edu.cn"

    avatar: Optional[str] = (
        "https://images.unsplash.com/"
        "photo-1534528741775-53994a69daeb"
        "?w=160&auto=format&fit=crop&q=80"
    )

    trustScore: Optional[int] = 98

    verified: Optional[bool] = True

    department: Optional[str] = (
        "计算机科学与技术学院"
    )


class ProductBase(BaseModel):
    model_config = {"extra": "ignore"}

    title: str = Field(
        ...,
        example="高等数学（同济第七版）"
    )

    category: str = Field(
        ...,
        example="书籍"
    )

    stream: Optional[str] = Field(
        "book",
        example="book"
    )
    # book, digital, living, transport

    price: float = Field(
        ...,
        example=18.0
    )

    originalPrice: Optional[float] = Field(
        None,
        example=58.0
    )

    mode: Optional[str] = Field(
        "BUY",
        example="BUY"
    )
    # BUY, RENT, EXCHANGE

    condition: Optional[str] = Field(
        "几乎全新",
        example="九成新，少量笔记"
    )

    stock: Optional[int] = Field(
        1,
        example=1
    )

    campus: Optional[str] = Field(
        "金明校区",
        example="金明校区"
    )

    pickupLocation: Optional[str] = Field(
        "图书馆门口",
        example="金明校区图书馆门口"
    )

    image: Optional[str] = Field(
        "https://images.unsplash.com/"
        "photo-1544716278-ca5e3f4abd8c"
        "?w=900&auto=format&fit=crop&q=80"
    )

    description: Optional[str] = Field(
        "",
        example="适合大一高数课程使用，书页完整，有少量笔记。"
    )

    # Seller information
    seller: Optional[SellerInfo] = Field(
        default_factory=SellerInfo
    )

    sellerId: Optional[str] = None

    # Rental-specific information
    rentalRate: Optional[str] = None

    # Exchange-specific information
    exchangeWish: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    model_config = {"extra": "ignore"}

    title: Optional[str] = None

    category: Optional[str] = None

    stream: Optional[str] = None

    price: Optional[float] = None

    originalPrice: Optional[float] = None

    mode: Optional[str] = None

    condition: Optional[str] = None

    stock: Optional[int] = None

    status: Optional[str] = None
    # available, reserved, sold

    campus: Optional[str] = None

    pickupLocation: Optional[str] = None

    image: Optional[str] = None

    description: Optional[str] = None

    rentalRate: Optional[str] = None

    exchangeWish: Optional[str] = None


class ProductResponse(ProductBase):
    id: str

    status: str = "available"

    created_at: Optional[str] = None

    updated_at: Optional[str] = None
