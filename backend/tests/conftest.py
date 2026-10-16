"""Shared pytest fixtures for the CampusCart backend test suite.

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
"""
import pytest


def pytest_collection_modifyitems(items):
    """Force every async test onto the session-scoped event loop."""
    asyncio_marker = pytest.mark.asyncio(loop_scope="session")
    for item in items:
        if getattr(item, "fixturenames", None):
            item.add_marker(asyncio_marker)


@pytest.fixture(autouse=True)
def _reset_mongo_singleton():
    """Drop any cached client so the next ``get_database()`` builds its own."""
    from app.core import mongodb

    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
    yield
    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
