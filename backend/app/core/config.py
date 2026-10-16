from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py → 仓库根目录
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = REPO_ROOT / "backend"

DEFAULT_JWT_SECRET = "campuscart_super_secret_jwt_key_2026"

# 固定端口（README / docs/dev-environment.md 中的端口表与这里保持一致）
FRONTEND_PORT = 3334
BACKEND_PORT = 8000
MONGO_PORT = 27017


class Settings(BaseSettings):
    """后端配置。

    读取顺序（后者覆盖前者）：代码默认值 → 仓库根目录 .env → backend/.env → 系统环境变量。
    用绝对路径读取 .env，无论从哪个目录启动后端都能读到。
    """

    APP_NAME: str = "CampusCart API"
    APP_VERSION: str = "1.0.0"

    # development / production
    APP_ENV: str = "development"

    # MongoDB Atlas / 本地
    MONGO_URI: str = f"mongodb://localhost:{MONGO_PORT}/?directConnection=true"
    MONGO_DB_NAME: str = "campuscart_db"

    # 可选关系型数据库（当前未使用）
    DATABASE_URL: str = "sqlite:///./campuscart.db"

    # 登录 token 签名密钥：.env 中必须换掉默认值
    JWT_SECRET_KEY: str = DEFAULT_JWT_SECRET
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 前端地址，会加入 CORS 白名单
    FRONTEND_URL: str = f"http://localhost:{FRONTEND_PORT}"

    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.strip().lower() == "production"

    @property
    def uses_default_secret(self) -> bool:
        return self.JWT_SECRET_KEY in ("", DEFAULT_JWT_SECRET, "change-me-to-a-long-random-string")


settings = Settings()
