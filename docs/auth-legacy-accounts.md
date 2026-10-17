# 历史账号处理说明（登录强制校验后的遗留问题）

## 一、问题背景

早期 `login` 接口在账号不存在时会**自动创建账号**，导致任何邮箱都能直接登录。
现在该行为已被移除，登录规则改为：

- 未注册的邮箱 → 一律拒绝（401「该邮箱尚未注册，请先注册后再登录。」）
- 密码错误 → 一律拒绝（401「邮箱或密码错误。」）

但数据库里可能已经存在一批**自动创建的历史账号**，它们的 `password_hash` 来自：

| 来源 | 实际存储的密码 |
| --- | --- |
| 用户首次登录时输入了密码 | 该密码 |
| 用户留空密码（前端默认发送） | `campuscart-demo-password` |
| 直接调接口且密码为空 | `student123` |

这些账号的所有者很可能**不知道自己当时填了什么**，会被新规则挡在门外。

## 二、解决思路

**只打标记，不改密码。** 迁移脚本给历史账号写入 `legacy_password_pending: true`：

- 记得原密码的用户 → 照常登录，不受影响；
- 忘记密码的用户 → 在注册页用**同一个邮箱**重设密码，即完成"认领"。

认领成功后标记自动清除，账号恢复正常。原有商品、订单、收藏等数据全部保留（只改 `users` 文档，不动其他集合）。

## 三、执行步骤

### 0. 当前数据库实测结果

在本地 `campuscart_db`（`.env` 中 `MONGO_URI` 指向 localhost）上执行演练脚本的结果：

```
MongoDB 连接正常
total users: 0
匹配到 0 个历史自动创建的账号
```

该库**没有任何集合**，所以本地不存在历史账号问题。如果线上 / Atlas 库已有自动创建的账号，把 `.env` 指向那个库后重跑脚本即可，输出会列出实际待处理的账号。

另外需要注意：正因为 `users` 为空，改造后**所有人都必须先注册再登录**，这正是"未注册账号不能登录"的预期行为。

### 1. 先演练（不写库）

```powershell
.\backend\.venv\Scripts\python.exe backend\migrate_legacy_accounts.py
```

会列出匹配到的账号邮箱、学号和当前标记状态，并提示"演练模式，未写入任何数据"。

### 2. 确认后写入

```powershell
.\backend\.venv\Scripts\python.exe backend\migrate_legacy_accounts.py --apply
```

脚本可重复执行（幂等），不会覆盖已认领的账号。

### 3. 部署

前后端改动在同一次提交中，合并到 `main` 后一起上线。**后端必须先于或同时上线**，否则前端的新提示与认领流程没有对应接口支持。

## 四、用户侧操作

| 场景 | 用户该怎么做 |
| --- | --- |
| 记得当初的密码 | 直接登录，无感知 |
| 忘记密码 | 打开登录弹窗 → 切到「注册」标签 → 填同一个邮箱 + 设新密码 → 提交即认领成功并自动登录 |
| 从未用过的新用户 | 正常走注册流程 |
| 已正常注册过的账号 | 注册页会提示"该邮箱已注册，请直接登录。"，密码需走登录页 |

注册页顶部有常驻说明；历史账号登录成功后也会弹出 toast 引导去认领。

## 五、涉及改动

| 文件 | 改动 |
| --- | --- |
| `backend/migrate_legacy_accounts.py` | 新增，标记历史账号（默认演练，`--apply` 才写入） |
| `backend/app/routes/auth.py` | `register` 支持历史账号认领；`serialize_user` 输出 `legacy_password_pending` |
| `backend/app/models/auth.py` | `UserProfile` 新增 `legacy_password_pending` 字段 |
| `frontend/src/App.jsx` | 摘要函数带出该标记；注册页提示；登录后引导 toast |

## 六、验证

迁移后抽查数据库：

```javascript
db.users.findOne({ email: "2023012345@henu.edu.cn" }, { legacy_password_pending: 1 })
```

注册页用该邮箱重设密码后，`legacy_password_pending` 应变为 `false`，且 `/api/v1/auth/me` 返回的用户信息中该字段为 `false`。
