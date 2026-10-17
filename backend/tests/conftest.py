"""Shared pytest fixtures for the CampusCart backend test suite.

Two concerns live here:

1. Event-loop hygiene (fix/errand-integration-tests-docs).
   ``mongo_manager`` is a module-level singleton whose Motor client is bound to
   whichever event loop first calls ``get_database()``. pytest-asyncio gives each
   async fixture and each async test its own function-scoped loop, so a client
   cached while a fixture ran is later reused from the test's different loop and
   Motor raises ``RuntimeError: ... attached to a different loop`` (surfacing as a
   500 from any write endpoint, and as a bogus 200 from the auto-provisioning
   login path).

   pytest-asyncio 0.24 has no "test loop scope" ini option, so the scope is set
   per item here: every test and every async fixture runs on one session-scoped
   loop, and the singleton cache is reset between tests so a client cached on a
   closed loop is never reused.

2. Clear results without MongoDB (upstream api-contract-check).
   When 127.0.0.1:27017 is unreachable, modules that need real reads and writes
   report as skipped instead of failing with a wall of connection errors.
"""

import socket

import pytest


MONGO_HOST = "127.0.0.1"
MONGO_PORT = 27017


def mongo_reachable(host: str = MONGO_HOST, port: int = MONGO_PORT, timeout: float = 1.0) -> bool:
    """探测本机 MongoDB 是否可连接。"""

    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


MONGO_AVAILABLE = mongo_reachable()

# 需要真实 MongoDB 的测试模块（对外接口用例，走真实读写）
MONGO_DEPENDENT_MODULES = {"test_errands"}


def pytest_collection_modifyitems(items):
    """Force every async test onto the session-scoped event loop."""
    asyncio_marker = pytest.mark.asyncio(loop_scope="session")
    for item in items:
        if getattr(item, "fixturenames", None):
            item.add_marker(asyncio_marker)


@pytest.fixture(autouse=True)
def require_mongodb(request):
    """MongoDB 不可用时，跳过依赖数据库的测试模块。"""

    if MONGO_AVAILABLE:
        return

    module_name = getattr(request.module, "__name__", "").rsplit(".", 1)[-1]

    if module_name in MONGO_DEPENDENT_MODULES:
        pytest.skip("MongoDB 未启动（127.0.0.1:27017）：跳过依赖数据库的用例")


@pytest.fixture(autouse=True)
def _reset_mongo_singleton():
    """Drop any cached client so the next ``get_database()`` builds its own."""
    from app.core import mongodb

    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
    yield
    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
