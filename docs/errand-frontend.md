# 校园跑腿前端闭环 · 后端字段约定

前端当前使用 `localStorage`（键：`campus-errand-tasks-v1`）保存任务，后续接入后端 API 时需要以下字段。

## 任务（Task / ErrandTask）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 任务唯一标识，前端临时用 `task-${Date.now()}` 生成 |
| `title` | string | 是 | 任务标题，最长 80 字 |
| `campus` | string | 是 | 校区，枚举：`金明校区`、`明伦校区` |
| `start` | string | 是 | 起点（校内地点） |
| `end` | string | 是 | 终点（校内地点） |
| `deadline` | string | 是 | 截止时间，前端使用 `datetime-local`，值为 `YYYY-MM-DDTHH:mm` |
| `reward` | number | 是 | 报酬（元），0–500 |
| `note` | string | 否 | 备注 |
| `status` | string | 是 | 任务状态，枚举：`待接单`、`已接单`、`已完成` |

## 状态流转

- 发布：`待接单`
- 接单：`待接单` → `已接单`
- 标记完成：`已接单` → `已完成`

## 建议的 API

- `GET /api/errands`：获取任务列表，支持 `campus` 与 `q` 筛选参数
- `POST /api/errands`：发布任务，请求体为上述字段（不含 `id`，由后端生成）
- `PATCH /api/errands/:id`：更新状态（`接单` / `标记完成`）

## 暂不实现

- 真实支付
- 实时聊天
- 数据库改动（当前仅前端本地保存）
