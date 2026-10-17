import logging
from urllib.parse import urlsplit

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

logger = logging.getLogger("campuscart.mongodb")


def redact_mongo_uri(uri: str) -> str:
    """去掉连接串里的用户名和密码，只保留主机部分，用于日志和健康检查。"""
    try:
        parts = urlsplit(uri)
        host = parts.hostname or "localhost"
        port = f":{parts.port}" if parts.port else ""
        return f"{parts.scheme}://{host}{port}"
    except ValueError:
        return "mongodb://<invalid uri>"


def short_error(e: Exception) -> str:
    """pymongo 的连接错误会带一长串拓扑描述，只保留第一句。"""
    text = str(e)
    for cut in (" (configured timeouts", ", Timeout:", ", Topology Description"):
        text = text.split(cut)[0]
    return f"{type(e).__name__}: {text}"[:200]


class MongoDBManager:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at: {redact_mongo_uri(settings.MONGO_URI)}")
            self.client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=5000,
            )
            self.db = self.client[settings.MONGO_DB_NAME]
            return self.db
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")
            raise e

    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")


mongo_manager = MongoDBManager()


def get_database():
    if mongo_manager.db is None:
        return mongo_manager.connect()
    return mongo_manager.db


async def describe_topology(db) -> dict:
    """查询 MongoDB 部署形态。

    下单、取消订单用了多文档事务，事务只在副本集（含 Atlas）或分片集群上可用；
    单机 mongod 能读写，但下单会报错。
    """
    hello = await db.command("hello")
    replica_set = hello.get("setName")
    is_sharded = hello.get("msg") == "isdbgrid"
    if replica_set:
        topology = "replica_set"
    elif is_sharded:
        topology = "sharded"
    else:
        topology = "standalone"
    return {
        "topology": topology,
        "replica_set": replica_set,
        "transactions_supported": bool(replica_set or is_sharded),
    }


async def check_mongo_health() -> dict:
    """GET /api/v1/health/mongodb 的返回内容。

    前端用 connected 字段判断数据库是否可用，字段名保持不变。
    """
    base = {
        "database": "MongoDB",
        "db_name": settings.MONGO_DB_NAME,
        "uri_host": redact_mongo_uri(settings.MONGO_URI),
    }
    try:
        db = get_database()
        await db.command("ping")
        build = await db.command("buildInfo")
        topo = await describe_topology(db)
        count = await db["products"].count_documents({})
        result = {
            "status": "healthy",
            **base,
            "connected": True,
            "server_version": build.get("version"),
            **topo,
            "products_count": count,
        }
        if not topo["transactions_supported"]:
            result["status"] = "degraded"
            result["hint"] = (
                "MongoDB 是单机模式，下单/取消订单需要事务，会失败。"
                "请按 docs/dev-environment.md 以副本集方式启动（--replSet rs0）。"
            )
        return result
    except Exception as e:
        logger.warning(f"MongoDB connection check failed: {e}")
        return {
            "status": "unreachable",
            **base,
            "connected": False,
            "error": short_error(e),
            "hint": (
                "连不上 MongoDB：确认 MongoDB 已启动（默认端口 27017），"
                "并检查仓库根目录 .env 中的 MONGO_URI。"
            ),
        }
