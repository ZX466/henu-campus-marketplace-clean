# 私信接口说明（最小闭环）

> 交付包五 · 成员 5 · 分支 `feature/conversation-api`
>
> 目标：商品或跑腿任务对应的**双人私信**，供聊天页面联调。
> 今天不做：WebSocket 实时推送、图片消息、群聊、推荐算法。

## 1. 文件

| 文件 | 内容 |
| --- | --- |
| `backend/app/routes/conversations.py` | 5 个私信接口 + 参与者权限检查 |
| `backend/app/models/conversation.py` | 会话请求/响应模型、去重键 |
| `backend/app/models/message.py` | 消息请求/响应模型、内容校验 |
| `backend/app/main.py` | 注册 `conversations_router`（只加了 2 行） |

启动后端后，在 <http://localhost:8000/docs> 的 **Conversations & Messages** 分组下可以看到全部接口。

## 2. 接口一览

所有接口都需要登录：带 Cookie `campuscart_session`，或请求头 `Authorization: Bearer <token>`（token 来自 `POST /api/v1/auth/login` 的返回值）。

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/v1/conversations` | 我的会话列表（按最近消息倒序，带未读数） |
| POST | `/api/v1/conversations` | 针对商品/跑腿任务发起私信，重复发起复用原会话 |
| GET | `/api/v1/conversations/{conversation_id}/messages` | 查看历史消息（旧 → 新，支持分页） |
| POST | `/api/v1/conversations/{conversation_id}/messages` | 发送文字消息 |
| POST | `/api/v1/conversations/{conversation_id}/read` | 把对方发来的消息标记为已读 |

## 3. 数据模型

### conversations 集合

```json
{
  "_id": "6650f1a2...",
  "target_type": "product",
  "target_id": "6650f0c2a1b2c3d4e5f60718",
  "target_title": "高等数学（同济第七版）",
  "participants": ["买家id", "卖家id"],
  "participant_key": "买家id:卖家id",
  "created_by": "买家id",
  "last_message": { "sender_id": "买家id", "content": "可以小刀吗", "created_at": "2026-10-13T14:55:18" },
  "unread_counts": { "买家id": 0, "卖家id": 2 },
  "created_at": "2026-10-13T14:50:00",
  "updated_at": "2026-10-13T14:55:18"
}
```

- `target_type`：`product`（二手商品）或 `errand`（跑腿任务）。
- `target_id`：商品 id；跑腿任务用 `task_id`（与 `docs/api-contract.md` 的跑腿字段一致）。
- `target_title`：创建时保存的标题快照，商品下架、任务完成后列表里仍然能显示。
- 唯一索引 `(target_type, target_id, participant_key)`：同一目标 + 同一对用户只有一个会话。

### messages 集合

```json
{
  "_id": "6650f1b3...",
  "conversation_id": "6650f1a2...",
  "sender_id": "买家id",
  "type": "text",
  "content": "这本书还在吗？",
  "read": false,
  "read_at": null,
  "created_at": "2026-10-13T14:52:00"
}
```

内容去掉首尾空格后需为 1~1000 字，空消息返回 422。

## 4. 请求示例

以下示例用 PowerShell（与 README 一致）。`$buyer`、`$seller` 是两个登录用户的请求头：

```powershell
$api = "http://localhost:8000/api/v1"
function Login($email) {
  $r = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType "application/json" `
       -Body (@{ email = $email; password = "student123" } | ConvertTo-Json)
  return @{ headers = @{ Authorization = "Bearer $($r.token)" }; id = $r.user.id }
}
$seller   = Login "seller@henu.edu.cn"
$buyer    = Login "buyer@henu.edu.cn"
$stranger = Login "stranger@henu.edu.cn"
```

### 示例 1：买家针对商品发起私信

```powershell
$body = @{ target_type = "product"; target_id = $productId } | ConvertTo-Json
$conv = Invoke-RestMethod "$api/conversations" -Method Post -Headers $buyer.headers `
        -ContentType "application/json" -Body $body
```

```http
POST /api/v1/conversations
Authorization: Bearer <买家token>
Content-Type: application/json

{ "target_type": "product", "target_id": "6650f0c2a1b2c3d4e5f60718" }
```

响应 `200`：

```json
{
  "id": "6650f1a2c0ffee0000000001",
  "target_type": "product",
  "target_id": "6650f0c2a1b2c3d4e5f60718",
  "target_title": "高等数学（同济第七版）",
  "participants": ["6650...买家", "6650...卖家"],
  "peer_id": "6650...卖家",
  "created_by": "6650...买家",
  "last_message": null,
  "unread_count": 0,
  "created_at": "2026-10-13T14:50:00.000000",
  "updated_at": "2026-10-13T14:50:00.000000",
  "created": true
}
```

- 不传 `peer_id` 时，对方自动取商品的 `sellerId`（跑腿任务取 `creator_id`）。
- 再次发起（包括卖家传 `peer_id` 反向发起）返回**同一个 `id`**，`created` 为 `false`。
- 卖家主动联系买家、或目标在库里查不到（例如还没入库的演示商品）时，需要传 `peer_id`。

### 示例 2：发送文字消息

```powershell
$cid = $conv.id
Invoke-RestMethod "$api/conversations/$cid/messages" -Method Post -Headers $buyer.headers `
  -ContentType "application/json" -Body (@{ content = "同学你好，这本书还在吗？" } | ConvertTo-Json)
```

```http
POST /api/v1/conversations/6650f1a2c0ffee0000000001/messages
Authorization: Bearer <买家token>
Content-Type: application/json

{ "content": "同学你好，这本书还在吗？" }
```

响应 `201`：

```json
{
  "id": "6650f1b3c0ffee0000000002",
  "conversation_id": "6650f1a2c0ffee0000000001",
  "sender_id": "6650...买家",
  "type": "text",
  "content": "同学你好，这本书还在吗？",
  "read": false,
  "read_at": null,
  "created_at": "2026-10-13T14:52:00.000000",
  "is_mine": true
}
```

发送后对方的 `unread_count` +1，会话的 `last_message`、`updated_at` 同步更新。

### 示例 3：卖家查看历史消息

```powershell
Invoke-RestMethod "$api/conversations/$cid/messages?limit=50" -Headers $seller.headers
```

```http
GET /api/v1/conversations/6650f1a2c0ffee0000000001/messages?limit=50
Authorization: Bearer <卖家token>
```

响应 `200`：

```json
{
  "conversation_id": "6650f1a2c0ffee0000000001",
  "items": [
    { "id": "...02", "sender_id": "6650...买家", "content": "同学你好，这本书还在吗？", "read": false, "is_mine": false, "created_at": "2026-10-13T14:52:00.000000" },
    { "id": "...03", "sender_id": "6650...买家", "content": "可以小刀吗", "read": false, "is_mine": false, "created_at": "2026-10-13T14:53:10.000000" }
  ],
  "has_more": false
}
```

- 按时间**正序**返回，前端直接从上往下渲染；`is_mine` 用来区分左右气泡。
- 加载更早的消息：`?before=<当前最早一条的 created_at>`，`limit` 最大 100。

### 示例 4：卖家标记已读

```powershell
Invoke-RestMethod "$api/conversations/$cid/read" -Method Post -Headers $seller.headers
```

响应 `200`：

```json
{ "conversation_id": "6650f1a2c0ffee0000000001", "marked_count": 2, "unread_count": 0 }
```

只会把**对方发给我**的未读消息标为已读；买家这时再查看历史，能看到 `read: true` 和 `read_at`。

### 示例 5：非参与者访问被拒绝

```powershell
Invoke-RestMethod "$api/conversations/$cid/messages" -Headers $stranger.headers
# → 403 {"detail":"你不是该会话的参与者，无权访问"}
```

## 5. 权限检查说明

| 场景 | 结果 |
| --- | --- |
| 未登录或 token 失效 | `401` |
| 会话 id 不存在或格式不对 | `404 会话不存在` |
| 非参与者查看消息 / 发送消息 / 标记已读 | `403 你不是该会话的参与者，无权访问` |
| `GET /conversations` | 只返回自己参与的会话，路人拿到空列表 |
| 和自己发起私信 | `400 不能和自己发起私信` |
| 商品/任务有发布者，但双方都不是发布者（路人拉另一个人聊别人的商品） | `403 该商品/任务的私信必须有发布者参与` |
| 无法确定对方（目标查不到又没传 `peer_id`） | `400` |
| `peer_id` 对应的用户不存在 | `404 对方用户不存在` |
| 消息为空或超过 1000 字、`target_type` 不是 product/errand | `422` |

实现方式：每个带 `{conversation_id}` 的接口都先调用 `_get_conversation_for_member()`，用登录 token 里的用户 id 和会话的 `participants` 比对，不通过直接中断，后面的读写不会执行。发送人 id 一律取自 token，不信任前端传的值。

## 6. 规则对照

| 交付包要求 | 实现 |
| --- | --- |
| 只有会话参与者可以查看消息 | `GET .../messages` 先做参与者校验，否则 403 |
| 只有会话参与者可以发送消息 | `POST .../messages` 先做参与者校验，否则 403 |
| 同一商品和同一对用户重复发起时复用原会话 | 唯一索引 + `upsert/$setOnInsert`，并发重复请求也只会生成一条 |
| 支持发送文字、查看历史、标记已读 | 示例 2、3、4 |
| 商品或任务结束后仍保留历史消息 | 会话和消息独立存储，没有删除接口，也不随商品删除/任务完成联动；`target_title` 保留快照 |

## 7. 验收演示步骤（约 3 分钟）

1. 启动后端，打开 `/docs`，展示 Conversations & Messages 下的 5 个接口。
2. 用卖家账号发布一个商品（`POST /api/v1/products`），记下返回的 `id`。
3. 买家 `POST /conversations` 发起会话 → 再发一次，展示 `id` 不变、`created: false`。
4. 买家发送两条消息 → 卖家 `GET /conversations` 看到 `unread_count: 2`。
5. 卖家 `GET .../messages` 查看历史 → `POST .../read` 标记已读 → 未读数清零。
6. 第三个账号访问同一会话的消息 → 返回 `403`。

## 8. 给前端联调的提示

- 进入商品详情点“私信卖家”：直接 `POST /conversations`，拿返回的 `id` 跳到聊天页，不用先判断是否已有会话。
- 聊天页打开时：`GET .../messages` 渲染，然后 `POST .../read`。
- 今天没有 WebSocket，聊天页可以每 3~5 秒轮询一次 `GET .../messages`，或在发送后主动刷新。
- 会话列表的红点直接用 `unread_count`，列表摘要用 `last_message.content`。
