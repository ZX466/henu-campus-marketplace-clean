"""统一 API 错误格式（周期一 · 王少鹏 · 核心接口字段检查）。

所有 4xx / 5xx 响应体统一为下面这一种结构，前端只需解析一次：

{
  "detail": "<人类可读消息>",
  "error": {
    "code": "PRODUCT_NOT_FOUND",   # 机器可读错误码，稳定不变
    "message": "<人类可读消息>",     # 与 detail 保持一致
    "status": 404,                 # HTTP 状态码
    "details": null                # 422 时为字段级错误列表，其余为 null
  }
}

`detail` 保留为字符串，兼容既有前端 `services/api.js` 里
`data?.detail` 的读取方式；新增的 `error` 对象提供结构化信息。
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorDetail(BaseModel):
    """统一错误对象（出现在 `error` 字段里）。"""

    code: str = Field(..., description="机器可读错误码，例如 PRODUCT_NOT_FOUND")
    message: str = Field(..., description="人类可读消息")
    status: int = Field(..., description="HTTP 状态码")
    details: Optional[Any] = Field(
        default=None,
        description="仅 422 返回字段级错误列表，其余为 null",
    )


class ErrorResponse(BaseModel):
    """统一错误响应体，所有 4xx / 5xx 都长这样。"""

    detail: str = Field(..., description="人类可读消息（保留以兼容旧前端）")
    error: ErrorDetail


# 供 APIRouter(responses=...) 复用，让 Swagger 直接展示统一错误结构
ERROR_RESPONSES: Dict[int, Dict[str, Any]] = {
    400: {
        "model": ErrorResponse,
        "description": "请求不合法：BAD_REQUEST / CART_EMPTY / INVALID_ORDER_ID / PRODUCT_UPDATE_EMPTY",
    },
    401: {
        "model": ErrorResponse,
        "description": "未登录或会话失效：AUTH_REQUIRED / AUTH_INVALID_SESSION",
    },
    403: {
        "model": ErrorResponse,
        "description": "无权限：FORBIDDEN / PRODUCT_UNASSIGNED / PRODUCT_NOT_OWNED / ERRAND_NOT_PARTICIPANT",
    },
    404: {
        "model": ErrorResponse,
        "description": "资源不存在：*_NOT_FOUND",
    },
    409: {
        "model": ErrorResponse,
        "description": "状态冲突：ERRAND_NOT_OPEN / ERRAND_SELF_CLAIM / INSUFFICIENT_STOCK / ORDER_NOT_CANCELLABLE",
    },
    422: {
        "model": ErrorResponse,
        "description": "字段校验失败：VALIDATION_ERROR（details 为字段级列表）",
    },
}


# 状态码 -> 默认错误码。路由可以传入更具体的 code 覆盖它。
DEFAULT_ERROR_CODES: Dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_ERROR",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
}

# Starlette 新旧版本对 422 的常量命名不同，这里做一次兼容。
VALIDATION_STATUS: int = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


def default_error_code(status_code: int) -> str:
    """返回状态码对应的默认错误码。"""

    return DEFAULT_ERROR_CODES.get(status_code, f"HTTP_{status_code}")


def build_error_body(
    status_code: int,
    message: str,
    code: Optional[str] = None,
    details: Optional[Any] = None,
) -> Dict[str, Any]:
    """构造统一错误响应体。"""

    resolved_code = code or default_error_code(status_code)

    return {
        "detail": message,
        "error": {
            "code": resolved_code,
            "message": message,
            "status": status_code,
            "details": details,
        },
    }


class ApiError(HTTPException):
    """带稳定错误码的 HTTPException。

    用法与 HTTPException 完全一致，额外接受 `code` 与 `details`：

        raise ApiError(404, "Product not found", code="PRODUCT_NOT_FOUND")
    """

    def __init__(
        self,
        status_code: int,
        message: str,
        code: Optional[str] = None,
        details: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.error_code = code or default_error_code(status_code)
        self.error_details = details


def _validation_details(exc: RequestValidationError) -> List[Dict[str, str]]:
    """把 FastAPI 的 422 校验错误压平成字段级列表。"""

    details: List[Dict[str, str]] = []

    for error in exc.errors():
        location = ".".join(str(part) for part in error.get("loc", ()))

        details.append(
            {
                "field": location,
                "message": str(error.get("msg", "")),
                "type": str(error.get("type", "")),
            }
        )

    return details


def register_error_handlers(app: FastAPI) -> None:
    """把所有异常统一转换成标准错误响应体。"""

    @app.exception_handler(StarletteHTTPException)
    async def _http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail: Any = exc.detail
        code = getattr(exc, "error_code", None)
        details = getattr(exc, "error_details", None)

        # 允许路由用 dict 作为 detail 传入 code / message / details
        if isinstance(detail, dict):
            message = str(
                detail.get("message")
                or detail.get("detail")
                or default_error_code(exc.status_code)
            )
            code = code or detail.get("code")
            if details is None:
                details = detail.get("details")
        else:
            message = str(detail)

        body = build_error_body(exc.status_code, message, code=code, details=details)

        return JSONResponse(
            status_code=exc.status_code,
            content=body,
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_exception_handler(request: Request, exc: RequestValidationError):
        body = build_error_body(
            VALIDATION_STATUS,
            "请求参数校验失败",
            code="VALIDATION_ERROR",
            details=_validation_details(exc),
        )

        return JSONResponse(
            status_code=VALIDATION_STATUS,
            content=body,
        )

    @app.exception_handler(PyMongoError)
    async def _mongodb_exception_handler(request: Request, exc: PyMongoError):
        """Expose a clear dependency failure instead of masking it as a 500."""
        body = build_error_body(
            503,
            "MongoDB 当前不可用，请先启动数据库后重试",
            code="DATABASE_UNAVAILABLE",
        )
        return JSONResponse(status_code=503, content=body)

    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):
        body = build_error_body(
            500,
            "服务器内部错误",
            code="INTERNAL_ERROR",
        )

        return JSONResponse(status_code=500, content=body)
