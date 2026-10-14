# 河大同享

河南大学金明校区、明伦校区校园二手交易与互助平台。网页应用，书籍交易是重点，包含商品发布、搜索筛选、收藏、购物车、订单、校园跑腿和校园助手等功能。

技术栈：React 18 + Vite 6 + Tailwind（前端）；FastAPI + MongoDB（后端）。

## 环境要求

| 组件 | 要求 |
| --- | --- |
| Node.js | 18+（推荐 20 LTS 或 22+） |
| Python | 3.12.x（推荐配合 uv） |
| MongoDB | 本地 7/8 或 Atlas（没有时页面仍显示演示数据，但登录/发布/订单不可用） |

## 快速启动（uv 版，推荐）

```powershell
# 1. 克隆并进入仓库根目录（所有命令都在根目录执行）
git clone https://github.com/ZX466/henu-campus-marketplace-clean.git
cd henu-campus-marketplace-clean

# 2. 安装前端依赖
npm install
npm run install:frontend

# 3. 创建后端虚拟环境并安装依赖
uv venv backend\.venv
uv pip install -r backend\requirements.txt --python backend\.venv\Scripts\python.exe

# 4. 在仓库根目录新建 .env
```

`.env` 内容：

```dotenv
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=campuscart_db
JWT_SECRET_KEY=请替换为本地随机字符串
FRONTEND_URL=http://localhost:3334
```

```powershell
# 5. 启动（终端一：后端 8000；终端二：前端 3334）
npm run dev:backend
npm run dev:frontend
```

打开 <http://localhost:3334>。

也可以一条命令同时启动前后端：`npm run dev`（需先完成虚拟环境创建）。

## 快速启动（普通 Python 版）

与 uv 版只有第 3 步不同：

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

macOS/Linux：

```bash
python3.12 -m venv backend/.venv
./backend/.venv/bin/python -m pip install -r backend/requirements.txt
./backend/.venv/bin/python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

之后启动命令与 uv 版完全相同（虚拟环境路径一致）。

## 验证启动

- 前端：<http://localhost:3334>
- 后端健康检查：<http://localhost:8000/api/v1/health>
- MongoDB 检查：<http://localhost:8000/api/v1/health/mongodb>
- 接口文档：<http://localhost:8000/docs>

前端端口在 `frontend/vite.config.js` 中固定为 3334；临时换端口：`npm --prefix frontend run dev -- --port 3001`。

前端默认连接 `http://localhost:8000`；如需修改，在 `frontend/.env.local` 写入 `VITE_API_URL=<地址>` 并重启 Vite。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 页面能打开但登录/同步失败 | 访问 MongoDB 检查地址；`connected: false` 时检查 MongoDB 服务和 `.env` 的 `MONGO_URI`。无 MongoDB 时登录走本地临时回退，重启即失效；注册和数据写入需恢复数据库 |
| 找不到后端虚拟环境 / 找不到 fastapi | 在仓库根目录按上面步骤创建 `backend\.venv` 并装依赖；已有则直接复用 |
| `py -3.12` 无法识别 | 用 `py --list` 查看本机登记的版本标识（如 `py -V:Astral/CPython3.12.15 -m venv backend\.venv`），或改用 uv 版 |
| `npm` 报 `ENOENT` 找不到 `package.json` | 当前目录错误：回到仓库根目录再执行 |
| `npm error code EALLOWSCRIPTS` | npm 12 会把用户 `.npmrc` 的 `allow-scripts` 条目经环境变量带入嵌套安装并拒绝。项目已内置修复（`install:frontend` 走 `scripts/install-frontend.cjs` 清理环境变量）；若直接在 `frontend/` 里安装仍报错，检查用户级 `.npmrc` 的 `allow-scripts` 行 |
| `npm error Exit handler never called!` | npm 11 兼容性问题：优先换 Node 20 LTS（npm 10）；或清理后用官方源重装（不要删 `package-lock.json`） |
| 安装显示 `10 vulnerabilities` | 审计提示，不是安装失败。可 `npm audit fix`；不要用 `--force`（会破坏主版本） |
| 商品图片加载失败 | 演示图片用 Unsplash 外链，网络不通属正常，不影响功能 |

## 标准安装顺序（一键复制）

```powershell
npm install
npm run install:frontend
npm run build
npm run dev
```

只想看界面（不装 MongoDB）：前三步换成 `npm install`、`npm run install:frontend`、`npm run dev:frontend`。

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
