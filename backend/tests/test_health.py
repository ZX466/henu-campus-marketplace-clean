"""周期一健康检查契约测试。

健康检查不应依赖真实 MongoDB；数据库连通性由 ``check_mongo_health``
单独验证，避免 CI 或新电脑没有数据库时把基础 API 测试全部拖垮。
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app import main as main_module


pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_health_endpoint_returns_service_status(client):
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["service"] == "CampusCart API"
    assert body["version"]
    assert body["timestamp"]


async def test_mongodb_health_endpoint_exposes_connection_result(client, monkeypatch):
    expected = {
        "status": "healthy",
        "database": "mongodb",
        "db_name": "campuscart_db",
        "products_count": 0,
        "connected": True,
        "transactions_supported": True,
    }
    async def fake_check_mongo_health():
        return expected

    monkeypatch.setattr(main_module, "check_mongo_health", fake_check_mongo_health)

    response = await client.get("/api/v1/health/mongodb")

    assert response.status_code == 200
    assert response.json() == expected
