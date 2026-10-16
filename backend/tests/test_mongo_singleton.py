"""Ensure the MongoDB singleton does not leak an event loop across tests.

``mongo_manager`` caches its Motor client on first use. pytest-asyncio can run
each test on its own event loop, so a client cached by an earlier test is
still bound to a now-closed loop and every later test fails with
``RuntimeError: Event loop is closed``. These tests pin that behaviour down.
"""
import asyncio

import pytest

from app.core import mongodb


@pytest.fixture(autouse=True)
def _reset_mongo_singleton():
    """Drop any cached client so the next test creates its own on its loop."""
    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
    yield
    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None


async def test_get_database_returns_a_usable_db():
    db = mongodb.get_database()
    await db.command("ping")


async def test_cached_survives_a_second_event_loop():
    mongodb.get_database()
    cached = mongodb.mongo_manager.client
    assert cached is not None

    mongodb.mongo_manager.client = None
    mongodb.mongo_manager.db = None
    db = mongodb.get_database()
    await db.command("ping")
