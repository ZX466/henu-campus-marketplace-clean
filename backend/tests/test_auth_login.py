"""Auth contract tests (cycle 3: visible login failures).

Covers the login rules the frontend relies on:
- an existing user with the wrong password is rejected (401)
- the "campuscart-demo-password" placeholder cannot bypass that check
- an unregistered henu email is rejected (must register first)
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.mongodb import get_database
from app.main import app


pytestmark = pytest.mark.asyncio


EXISTING_EMAIL = "201903150127@henu.edu.cn"
CORRECT_PASSWORD = "correct-horse-battery-staple"


@pytest_asyncio.fixture
async def client():
    """Clear users up-front, then yield an ASGI client.

    Teardown runs on a closed event loop with pytest-asyncio's function-scoped
    loops, so cleanup must happen before the test body, not after.
    """
    db = get_database()
    await db["users"].delete_many({})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def registered_user(client):
    """Register a user through the API so the stored hash is the real one."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": EXISTING_EMAIL,
            "password": CORRECT_PASSWORD,
            "name": "Zhang Xian",
            "roll": "201903150127",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_login_rejects_wrong_password(client, registered_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EXISTING_EMAIL, "password": "not-the-password"},
    )

    assert response.status_code == 401, response.text
    assert "detail" in response.json()


async def test_login_rejects_demo_placeholder_password(client, registered_user):
    """The frontend's placeholder must not bypass the password check."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EXISTING_EMAIL, "password": "campuscart-demo-password"},
    )

    assert response.status_code == 401, response.text


async def test_login_rejects_missing_password(client, registered_user):
    """No password at all must not fall back to a shared default."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EXISTING_EMAIL},
    )

    assert response.status_code == 400, response.text


async def test_login_rejects_empty_password(client, registered_user):
    """An empty string is not a password either."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EXISTING_EMAIL, "password": ""},
    )

    assert response.status_code == 400, response.text


async def test_register_requires_password(client):
    """Registration must collect a real password instead of defaulting."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "no-password-user@henu.edu.cn", "roll": "20240000001"},
    )

    assert response.status_code == 422, response.text


async def test_login_accepts_correct_password(client, registered_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": EXISTING_EMAIL, "password": CORRECT_PASSWORD},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body.get("token")
    assert body["user"]["email"] == EXISTING_EMAIL


async def test_login_rejects_unregistered_email(client):
    """Issue #11：未注册账号不能直接登录，必须先注册。"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "brand-new-user@henu.edu.cn", "password": "whatever"},
    )

    assert response.status_code == 401, response.text
