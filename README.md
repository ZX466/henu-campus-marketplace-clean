# 河大同享

河南大学金明校区、明伦校区校园二手交易与互助平台。网页应用，书籍交易是重点，包含商品发布、搜索筛选、收藏、购物车、订单、校园跑腿和校园助手等功能。

技术栈：React 18 + Vite 6 + Tailwind（前端）；FastAPI + MongoDB（后端）。

## 环境要求

| 组件 | 要求 |
| --- | --- |
| Node.js | 18+（推荐 20 LTS） |
| Python | 3.10+（推荐 3.12）；`npm run setup:backend` 会自动查找，找不到时用 uv 安装 |
| MongoDB | 7/8，**副本集模式**（下单用到事务），或 MongoDB Atlas。没有数据库时页面仍显示演示数据，但发布、订单等写入不可用 |

| 服务 | 地址 |
| --- | --- |
| 前端 | <http://localhost:3334> |
| 后端 | <http://localhost:8000>（接口文档 `/docs`） |
| MongoDB | `localhost:27017` |

## 快速启动

所有命令都在仓库根目录执行（能看到 `package.json`、`frontend`、`backend` 的目录）。

```powershell
# 1. 克隆
git clone https://github.com/hwd-123456/henu-campus-marketplace-clean.git
cd henu-campus-marketplace-clean

# 2. 安装前端依赖 + 创建后端虚拟环境（只需一次）
npm run setup

# 3. 生成配置，并把 JWT_SECRET_KEY 改成随机字符串
copy .env.example .env          # macOS/Linux：cp .env.example .env

# 4. 启动 MongoDB（Docker 方式；本机安装或 Atlas 见 docs/dev-environment.md）
npm run db:start

# 5. 启动前后端（或分两个终端：npm run dev:backend / npm run dev:frontend）
npm run dev

# 6. 另开终端检查
npm run check:health
```

`check:health` 全部显示 ✅ 后打开 <http://localhost:3334>。MongoDB 三种启动方式、环境变量说明和排错详见 [docs/dev-environment.md](docs/dev-environment.md)。

<details>
<summary>不用 npm 脚本、手动创建后端环境</summary>

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

> 本机没有安装 Python Launcher（`py` 命令）时，改用：
> `python -m venv backend\.venv`
> （确认 `python --version` 为 3.12.x；若不是，改用上面的 uv 版，
> uv 可用 `--python 3.12` 自动取得对应解释器）

macOS/Linux：

```bash
python3.12 -m venv backend/.venv
./backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

</details>

## 验证启动

- 一条命令：`npm run check:health`
- 后端健康检查：<http://localhost:8000/api/v1/health>
- MongoDB 检查：<http://localhost:8000/api/v1/health/mongodb>（`connected: true` 且 `transactions_supported: true` 为正常）
- 接口文档：<http://localhost:8000/docs>

前端端口在 `frontend/vite.config.js` 中固定为 3334；临时换端口：`npm --prefix frontend run dev -- --port 3001`（同时把 `.env` 的 `FRONTEND_URL` 改成新地址）。前端默认连接 `http://localhost:8000`；如需修改，参照 `frontend/.env.example` 新建 `frontend/.env.local` 并重启 Vite。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 页面能打开但登录/同步失败 | 运行 `npm run check:health`，按提示处理；`connected: false` 时检查 MongoDB 服务和 `.env` 的 `MONGO_URI`。无 MongoDB 时登录会走本地临时回退，重启即失效；注册和数据写入需恢复数据库 |
| 下单失败，提示 Transaction numbers… | MongoDB 是单机模式，需要副本集：用 `npm run db:start`，或按 docs/dev-environment.md 第 4 节配置 |
| 找不到后端虚拟环境 / 找不到 fastapi | 在仓库根目录运行 `npm run setup:backend` |
| `npm run setup:backend` 找不到 Python | 安装 Python 3.12 或 uv；或指定解释器：`$env:PYTHON="C:\路径\python.exe"; npm run setup:backend`。本机没有 `py` 命令时，也可用 `python -m venv backend\.venv`（确认 `python --version` 为 3.12.x），或直接用 uv 版（`uv venv backend\.venv --python 3.12`） |
| `npm` 报 `ENOENT` 找不到 `package.json` | 当前目录错误：回到仓库根目录再执行 |
| `npm error code EALLOWSCRIPTS` | npm 12 会把用户 `.npmrc` 的 `allow-scripts` 条目经环境变量带入嵌套安装并拒绝。项目已内置修复（`install:frontend` 走 `scripts/install-frontend.cjs` 清理环境变量）；若直接在 `frontend/` 里安装仍报错，检查用户级 `.npmrc` 的 `allow-scripts` 行 |
| `npm error Exit handler never called!` | npm 11 兼容性问题：优先换 Node 20 LTS（npm 10）；或清理后用官方源重装（不要删 `package-lock.json`） |
| 安装显示 `10 vulnerabilities` | 审计提示，不是安装失败。可 `npm audit fix`；不要用 `--force`（会破坏主版本） |
| 商品图片加载失败 | 演示图片用 Unsplash 外链，网络不通属正常，不影响功能 |

## 当前功能模块

- 商品浏览、搜索、分类和校区筛选
- 商品发布、收藏、购物车和订单
- 卖家管理和通知
- 书籍专区与校园书单
- 校园跑腿任务
- 金明、明伦校区地图和交接点
- CampusBot 校园助手

## 团队开发约定

从 `main` 创建功能分支，完成小功能后提交 Pull Request。提交前执行：

```powershell
npm run build
.\backend\.venv\Scripts\python.exe -m compileall backend
```

## 来源与许可

本项目基于 [Sowmajit-Kar/CAMPUSCART](https://github.com/Sowmajit-Kar/CAMPUSCART) 二次开发，保留原项目 MIT License。河南大学业务设计、界面、演示数据和功能实现由本项目组维护。
