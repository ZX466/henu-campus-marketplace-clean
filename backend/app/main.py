import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.mongodb import get_database, check_mongo_health, describe_topology, mongo_manager, redact_mongo_uri
from app.routes.products import router as products_router
from app.routes.auth import router as auth_router
from app.routes.cart import router as cart_router
from app.routes.wishlist import router as wishlist_router
from app.routes.orders import router as orders_router
from app.routes.notifications import router as notifications_router
from app.routes.booklists import router as booklists_router
from app.routes.wishes import router as wishes_router
from app.routes.conversations import router as conversations_router
from app.routes.errands import router as errands_router
from app.data.initial_data import INITIAL_PRODUCTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campuscart.api")


# --------------------------------------------------
# Lifespan: Auto-Connect & Auto-Seed MongoDB
# --------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting CampusCart API...")
    logger.info(f"APP_ENV={settings.APP_ENV} | MongoDB={redact_mongo_uri(settings.MONGO_URI)}/{settings.MONGO_DB_NAME} | FRONTEND_URL={settings.FRONTEND_URL}")
    if settings.uses_default_secret:
        logger.warning("⚠️ JWT_SECRET_KEY 仍是默认值：本地开发可以，部署前必须在 .env 中换成随机长字符串。")
    try:
        db = get_database()
        await db.command("ping")
        logger.info("✅ Connected to MongoDB successfully!")
        topo = await describe_topology(db)
        if not topo["transactions_supported"]:
            logger.warning("⚠️ MongoDB 是单机模式，下单/取消订单需要事务会失败；请以副本集方式启动，见 docs/dev-environment.md。")

        # Option 1: Auto-seed initial items if collection is empty
        count = await db["products"].count_documents({})
        if count == 0:
            logger.info("📦 Products collection is empty. Auto-seeding initial campus marketplace data...")
            now = datetime.utcnow().isoformat()
            seeded = []
            for item in INITIAL_PRODUCTS:
                entry = dict(item)
                entry["created_at"] = now
                entry["updated_at"] = now
                seeded.append(entry)
            await db["products"].insert_many(seeded)
            logger.info(f"🎉 Successfully seeded {len(seeded)} initial items into MongoDB!")
        else:
            logger.info(f"📊 MongoDB currently has {count} active products.")
    except Exception as e:
        logger.warning(f"⚠️ MongoDB connection not established at startup (will retry on requests): {e}")

    yield

    logger.info("🛑 Shutting down CampusCart API...")
    mongo_manager.close()


app = FastAPI(
    title="CampusCart API",
    description="Hyperlocal Collegiate Marketplace & Peer Logistics API with MongoDB Atlas",
    version="1.0.0",
    lifespan=lifespan
)

# 统一 400 / 401 / 403 / 404 / 409 / 422 / 500 的错误响应格式
register_error_handlers(app)


# --------------------------------------------------
# CORS - Production (Vercel) & Local Development
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted({
        # Local development（前端固定 3334 端口）
        "http://localhost:3334",
        "http://127.0.0.1:3334",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Vercel production frontend (no trailing slash!)
        "https://campuscart-iota-one.vercel.app",
        # .env 中配置的前端地址（部署时改这里即可）
        settings.FRONTEND_URL.rstrip("/"),
    }),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Health Checks
# --------------------------------------------------
@app.get("/api/v1/health", tags=["Health Checks"])
async def health_check():
    return {
        "status": "healthy",
        "service": "CampusCart API",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/v1/health/mongodb", tags=["Health Checks"])
async def mongodb_health_check():
    """Live verification endpoint for instructor / viva demonstration"""
    return await check_mongo_health()


# --------------------------------------------------
# Mount API Routers
# --------------------------------------------------
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(wishlist_router)
app.include_router(orders_router)
app.include_router(notifications_router)
app.include_router(booklists_router)
app.include_router(wishes_router)
app.include_router(conversations_router)
app.include_router(errands_router)
