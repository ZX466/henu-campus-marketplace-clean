# 书单与智能求购接口

## 接口

### `GET /api/v1/booklists`

返回项目内置的少量书单条目。可选查询参数：`major`、`course`、`campus`。当前只返回课程和适用范围，不声明未经核实的教材版本、ISBN、价格或库存。

示例：

```text
GET http://localhost:8000/api/v1/booklists?course=数据库原理&campus=金明校区
```

### `POST /api/v1/wishes/parse`

使用本地规则解析求购文字，不调用外部模型。请求体：

```json
{
  "text": "我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区"
}
```

返回：

```json
{
  "major": "软件工程",
  "grade": "2024级",
  "course": "数据库原理",
  "budget_max": 50,
  "campus": "金明校区",
  "missing_fields": [],
  "need_confirm": true
}
```

`missing_fields` 固定使用 `major`、`grade`、`course`、`budget_max`、`campus` 这些字段名。解析不完整时只返回能从原文确认的字段，不猜测教材版本；前端应提示用户补充缺失字段并确认解析结果。

## 三组联调输入

### 1. 字段完整

输入：`我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区`

预期：`missing_fields` 为空，字段分别为软件工程、2024级、数据库原理、50、金明校区。

### 2. 缺少预算和校区

输入：`大三计算机科学与技术学生想买操作系统教材`

预期：`major=计算机科学与技术`、`grade=大三`、`course=操作系统`，`missing_fields=["budget_max", "campus"]`。

### 3. 只有课程和预算

输入：`求购高等数学课本，预算30元以内`

预期：`course=高等数学`、`budget_max=30`，`missing_fields=["major", "grade", "campus"]`。

## 本地验证

启动后端后，可以访问 <http://localhost:8000/docs>，也可以用 PowerShell：

```powershell
Invoke-RestMethod http://localhost:8000/api/v1/booklists
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/v1/wishes/parse `
  -ContentType "application/json" `
  -Body '{"text":"我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区"}'
```
