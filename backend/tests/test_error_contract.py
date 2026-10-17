"""统一错误格式测试（周期一 · 王少鹏 · 核心接口字段检查）。

覆盖 400 / 401 / 403 / 404 / 409 / 422，断言响应体统一为：
{"detail": "...", "error": {"code": ..., "message": ..., "status": ..., "details": ...}}

这些用例不依赖 MongoDB：要读库的路径通过 monkeypatch 注入内存假数据库。
"""

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.auth import create_session_token
from app.main import app
from app.routes import errands as errands_routes
from app.routes import products as products_routes

USER_TOKEN = create_session_token("user-001", "u1@henu.edu.cn", "王少鹏")
OTHER_TOKEN = create_session_token("user-002", "u2@henu.edu.cn", "李同学")
THIRD_TOKEN = create_session_token("user-003", "u3@henu.edu.cn", "赵同学")


class FakeCursor:
    def __init__(self, docs):
        self._docs = list(docs)

    def sort(self, *args, **kwargs):
        return self

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = list(docs or [])

    async def find_one(self, query, *args, **kwargs):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in (query or {}).items()):
                return dict(doc)
        return None

    async def insert_one(self, doc, *args, **kwargs):
        self.docs.append(dict(doc))
        return type("InsertResult", (), {"inserted_id": "fake-id"})()

    async def update_one(self, query, update, *args, **kwargs):
        for index, doc in enumerate(self.docs):
            if all(doc.get(k) == v for k, v in (query or {}).items()):
                updated = dict(doc)
                updated.update((update or {}).get("$set", {}))
                self.docs[index] = updated
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    def find(self, query=None, *args, **kwargs):
        return FakeCursor(self.docs)


class FakeDatabase:
    def __init__(self, **collections):
        self._collections = {name: FakeCollection(docs) for name, docs in collections.items()}

    def __getitem__(self, name):
        return self._collections.setdefault(name, FakeCollection())


def assert_envelope(body, status_code, code):
    assert set(body) >= {"detail", "error"}, body
    assert isinstance(body["detail"], str) and body["detail"], body
    error = body["error"]
    assert error["code"] == code, error
    assert error["status"] == status_code, error
    assert error["message"] == body["detail"], error
    assert "details" in error


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def errand_payload(**overrides):
    payload = {
        "campus": "金明校区",
        "title": "代取快递",
        "origin": "北门",
        "destination": "宿舍",
        "reward": 3,
    }
    payload.update(overrides)
    return payload


async def test_401_requires_auth(client):
    resp = await client.post("/api/v1/errands", json=errand_payload())
    assert resp.status_code == 401
    assert_envelope(resp.json(), 401, "AUTH_REQUIRED")


async def test_401_invalid_session(client):
    resp = await client.get("/api/v1/orders", headers=auth("not-a-real-token"))
    assert resp.status_code == 401
    assert_envelope(resp.json(), 401, "AUTH_INVALID_SESSION")


async def test_422_validation_details(client):
    resp = await client.post("/api/v1/errands", json=errand_payload(reward=-5), headers=auth(USER_TOKEN))
    assert resp.status_code == 422
    body = resp.json()
    assert_envelope(body, 422, "VALIDATION_ERROR")
    details = body["error"]["details"]
    assert isinstance(details, list) and details, body
    assert all({"field", "message", "type"} <= set(item) for item in details)
    assert any("reward" in item["field"] for item in details), details


async def test_422_missing_required_field(client):
    resp = await client.post("/api/v1/errands", json={"title": "缺少校区"}, headers=auth(USER_TOKEN))
    assert resp.status_code == 422
    assert_envelope(resp.json(), 422, "VALIDATION_ERROR")


async def test_400_empty_cart(client):
    resp = await client.post("/api/v1/orders/checkout", json={"items": []}, headers=auth(USER_TOKEN))
    assert resp.status_code == 400
    assert_envelope(resp.json(), 400, "CART_EMPTY")


async def test_400_invalid_order_id(client):
    resp = await client.post("/api/v1/orders/not-an-object-id/cancel", headers=auth(USER_TOKEN))
    assert resp.status_code == 400
    assert_envelope(resp.json(), 400, "INVALID_ORDER_ID")


async def test_400_auth_missing_password(client):
    """登录缺密码：统一格式 + 稳定的 AUTH_PASSWORD_REQUIRED 错误码。"""

    resp = await client.post("/api/v1/auth/login", json={"email": "someone@henu.edu.cn"})
    assert resp.status_code == 400
    assert_envelope(resp.json(), 400, "AUTH_PASSWORD_REQUIRED")


async def test_404_product_not_found(client, monkeypatch):
    monkeypatch.setattr(products_routes, "get_database", lambda: FakeDatabase())
    resp = await client.get("/api/v1/products/unknown-product")
    assert resp.status_code == 404
    assert_envelope(resp.json(), 404, "PRODUCT_NOT_FOUND")


async def test_404_errand_not_found(client, monkeypatch):
    monkeypatch.setattr(errands_routes, "get_database", lambda: FakeDatabase(errands=[]))
    resp = await client.post("/api/v1/errands/task-missing/claim", headers=auth(USER_TOKEN))
    assert resp.status_code == 404
    assert_envelope(resp.json(), 404, "ERRAND_NOT_FOUND")


async def test_409_errand_already_completed(client, monkeypatch):
    fake = FakeDatabase(errands=[{"task_id": "task-done", "creator_id": "user-001",
                                  "claimer_id": "user-002", "status": "completed"}])
    monkeypatch.setattr(errands_routes, "get_database", lambda: fake)
    resp = await client.post("/api/v1/errands/task-done/claim", headers=auth(THIRD_TOKEN))
    assert resp.status_code == 409
    assert_envelope(resp.json(), 409, "ERRAND_NOT_OPEN")


async def test_409_creator_cannot_claim_own_task(client, monkeypatch):
    fake = FakeDatabase(errands=[{"task_id": "task-open", "creator_id": "user-001",
                                  "claimer_id": None, "status": "open"}])
    monkeypatch.setattr(errands_routes, "get_database", lambda: fake)
    resp = await client.post("/api/v1/errands/task-open/claim", headers=auth(USER_TOKEN))
    assert resp.status_code == 409
    assert_envelope(resp.json(), 409, "ERRAND_SELF_CLAIM")


async def test_403_third_party_cannot_complete(client, monkeypatch):
    fake = FakeDatabase(errands=[{"task_id": "task-claimed", "creator_id": "user-001",
                                  "claimer_id": "user-002", "status": "claimed"}])
    monkeypatch.setattr(errands_routes, "get_database", lambda: fake)
    resp = await client.post("/api/v1/errands/task-claimed/complete", headers=auth(THIRD_TOKEN))
    assert resp.status_code == 403
    assert_envelope(resp.json(), 403, "ERRAND_NOT_PARTICIPANT")


async def test_success_path_is_not_wrapped(client, monkeypatch):
    monkeypatch.setattr(errands_routes, "get_database", lambda: FakeDatabase(errands=[]))
    resp = await client.post("/api/v1/errands", json=errand_payload(), headers=auth(USER_TOKEN))
    assert resp.status_code == 201
    body = resp.json()
    assert "error" not in body
    assert body["status"] == "open"
    assert body["creator_id"] == "user-001"
