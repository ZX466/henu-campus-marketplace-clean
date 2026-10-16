from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    model_config = {"extra": "ignore"}
    email: str = Field(..., example="2024xxxx@henu.edu.cn", description="河南大学学生邮箱")
    # 无默认值：调用方必须显式提供密码，避免后端静默填充共享口令
    password: Optional[str] = Field(default=None, example=None, description="Student password")


class RegisterRequest(BaseModel):
    model_config = {"extra": "ignore"}
    email: str = Field(..., example="2024xxxx@henu.edu.cn")
    password: str = Field(..., example="Ch00seAStrongPass", description="User-chosen password")
    name: Optional[str] = Field(default="Aarav Patel", example="Aarav Patel")
    roll: Optional[str] = Field(default="2024CS1089", example="2024CS1089")
    department: Optional[str] = Field(default="Computer Science & Engineering", example="Computer Science & Engineering")
    campus: Optional[str] = Field(default="河南大学金明校区", example="河南大学金明校区")


class UserProfile(BaseModel):
    model_config = {"extra": "ignore"}
    id: Optional[str] = None
    email: str
    roll: str
    name: str
    department: Optional[str] = "Computer Science & Engineering"
    dept: Optional[str] = "Computer Science & Engineering"
    campus: Optional[str] = "河南大学金明校区"
    hostel: Optional[str] = "校园宿舍"
    verified: bool = True
    trustScore: int = 98
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class UserResponse(UserProfile):
    pass


class LoginResponse(BaseModel):
    model_config = {"extra": "ignore"}
    success: bool = True
    token: str
    token_type: str = "bearer"
    message: str = "Authentication successful"
    user: UserProfile


class AuthResponse(BaseModel):
    model_config = {"extra": "ignore"}
    success: bool = True
    user: UserProfile
    token: Optional[str] = None
