"""
标记"历史自动创建"的校园账号。

背景
----
早期 login 接口在账号不存在时会自动创建账号，password_hash 取自用户
首次登录时输入的密码；前端历史上还会在密码为空时默认发送
"campuscart-demo-password"，直接调接口且密码为空时则固定为 "student123"。
于是数据库里可能存在一批"从未真正注册过、密码也无人记得"的账号。

现在 login 已强制校验密码（未注册一律拒绝、密码错误一律拒绝），
这些账号会被挡在门外。本脚本只给它们打上 legacy_password_pending 标记，
**不改动 password_hash**：

  * 记得原密码的用户 -> 仍可正常登录；
  * 不记得密码的用户 -> 在注册页用同一个邮箱重设密码即可"认领"账号，
                        认领成功后标记自动清除。

用法
----
    # 1. 先演练，看会影响哪些账号（不写库，默认模式）
    .\\backend\\.venv\\Scripts\\python.exe backend\\migrate_legacy_accounts.py

    # 2. 确认无误后写入
    .\\backend\\.venv\\Scripts\\python.exe backend\\migrate_legacy_accounts.py --apply
"""
import argparse
import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime

from app.core.auth import hash_password
from app.core.mongodb import get_database, mongo_manager

# 历史版本里出现过的两个"默认密码"
LEGACY_DEFAULT_PASSWORDS = ["student123", "campuscart-demo-password"]

# 写入 users 集合的标记字段
FLAG_FIELD = "legacy_password_pending"


async def main():
    parser = argparse.ArgumentParser(
        description="标记历史自动创建账号（默认演练，加 --apply 才写入）"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="真正写入标记；不加则只演练统计",
    )
    args = parser.parse_args()

    print("历史账号标记脚本")
    print(f"  模式: {'写入 (--apply)' if args.apply else '演练（默认，不写库）'}")
    print(f"  待识别密码: {', '.join(LEGACY_DEFAULT_PASSWORDS)}")
    print(f"  标记字段: {FLAG_FIELD}")

    try:
        db = get_database()
        await db.command("ping")
        print("\nMongoDB 连接正常")

        legacy_hashes = sorted({hash_password(p) for p in LEGACY_DEFAULT_PASSWORDS})
        query = {"password_hash": {"$in": legacy_hashes}}

        matched = await db["users"].find(query).to_list(length=None)

        print(f"\n匹配到 {len(matched)} 个历史自动创建的账号：")
        for doc in matched:
            already = "是" if doc.get(FLAG_FIELD) else "否"
            print(
                f"  - {doc.get('email')}  "
                f"roll={doc.get('roll')}  "
                f"已标记={already}"
            )

        if not matched:
            print("\n没有需要处理的账号。")
            return

        if not args.apply:
            print("\n演练模式，未写入任何数据。确认无误后加 --apply 执行。")
            return

        now = datetime.utcnow().isoformat()
        result = await db["users"].update_many(
            query,
            {"$set": {FLAG_FIELD: True, "updated_at": now}},
        )

        print(f"\n已为 {result.modified_count} 个账号写入 {FLAG_FIELD} 标记。")
        print("这些账号仍可用原密码登录；忘记密码可在注册页重设密码完成认领。")

    except Exception as e:
        print(f"\n执行失败: {e}")
    finally:
        mongo_manager.close()
        print("\n连接已关闭。")


if __name__ == "__main__":
    asyncio.run(main())
