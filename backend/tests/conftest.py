"""pytest 公共夹具（周期一 · 王少鹏）。

让后端测试在「有 MongoDB」和「没有 MongoDB」两种环境下都能给出明确结论：
数据库不可用时，依赖真实数据库的用例显示为 skipped，而不是一片连接报错。

真机上有 MongoDB 时，这个夹具不做任何事，所有用例照常执行。
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


@pytest.fixture(autouse=True)
def require_mongodb(request):
    """MongoDB 不可用时，跳过依赖数据库的测试模块。"""

    if MONGO_AVAILABLE:
        return

    module_name = getattr(request.module, "__name__", "").rsplit(".", 1)[-1]

    if module_name in MONGO_DEPENDENT_MODULES:
        pytest.skip("MongoDB 未启动（127.0.0.1:27017）：跳过依赖数据库的用例")
