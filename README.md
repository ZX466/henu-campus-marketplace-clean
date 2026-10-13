# 河大同享

河南大学金明校区、明伦校区校园二手交易与互助平台。第一版是网页应用，书籍交易是重点，同时包含商品发布、搜索筛选、收藏、购物车、订单、校园跑腿和校园助手等功能。

## 先看网页演示

如果只是先查看网页界面，可以只启动前端。没有 MongoDB 时，页面仍会显示内置演示商品；需要登录、发布、订单同步等真实数据功能时，再按后端步骤启动 API 和 MongoDB。

启动后访问：<http://localhost:3000>

## 当前技术版本

| 组件 | 要求 | 说明 |
| --- | --- | --- |
| 操作系统 | Windows 10/11、macOS 或 Linux | 本文命令以 Windows PowerShell 为例 |
| Node.js | 18 或更高，推荐 20 LTS 或 22+ | 当前依赖的 Vite 6 要求 Node 18+；已用 Node 24.15 验证 |
| npm | 随 Node.js 安装，推荐 9 或更高 | 当前环境使用 npm 11.12 |
| Python | 推荐 3.12.x | 后端依赖已用 Python 3.12.15 安装验证 |
| FastAPI | `>=0.100.0` | 由 `backend/requirements.txt` 安装 |
| Uvicorn | `>=0.22.0` | 用于启动后端开发服务器 |
| MongoDB | 本地 MongoDB 7/8，或 MongoDB Atlas | 后端启动可以暂时没有数据库，但真实接口需要数据库 |

检查版本：

```powershell
node --version
npm --version
python --version
```

## 先确认当前目录

所有 `npm`、`git` 和后端启动命令都要在仓库根目录执行，也就是能同时看到 `package.json`、`frontend` 和 `backend` 的目录。不要在桌面目录直接运行 `npm install`。

Windows PowerShell 示例：

```powershell
cd "E:\zxdevelop\project8\henu-campus-marketplace-clean"
Test-Path .\package.json
Get-ChildItem .\frontend\package.json, .\backend\requirements.txt
```

第一条检查应返回 `True`。如果返回 `False`，先用资源管理器进入实际仓库目录，再重新打开 PowerShell。

## 第一次安装

在仓库根目录执行：

```powershell
npm install
npm run install:frontend
```

如果仓库中已经有 `backend\.venv`，直接继续安装后端依赖，不要重复创建虚拟环境：

```powershell
.\backend\.venv\Scripts\python.exe --version
.\backend\.venv\Scripts\python.exe -m pip install --upgrade pip
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

如果没有 `backend\.venv`，先查看本机 Python 启动器实际登记的版本：

```powershell
py --list
where.exe python
```

只有当 `py --list` 中确实出现 3.12 时，才使用：

```powershell
py -3.12 -m venv backend\.venv
```

如果 `py -3.12` 报“无法识别 Python”，说明 Python 是通过其他发行方式安装的。使用 `py --list` 显示的完整标识，例如：

```powershell
py -V:Astral/CPython3.12.15 -m venv backend\.venv
```

也可以直接调用 `where.exe python` 找到的 3.12 `python.exe`：

```powershell
& "C:\path\to\python.exe" -m venv backend\.venv
```

创建完成后，再执行上面的虚拟环境依赖安装命令。不要在桌面目录直接执行 `backend\\.venv` 路径命令；必须先进入仓库根目录。

## 只启动前端查看页面

```powershell
npm run dev:frontend
```

打开 <http://localhost:3000>。端口在 `frontend/vite.config.js` 中固定为 3000。需要换端口时运行：

```powershell
npm --prefix frontend run dev -- --port 3001
```

## 启动后端 API

在仓库根目录新建 `.env`：

```dotenv
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=campuscart_db
JWT_SECRET_KEY=请替换为本地随机字符串
FRONTEND_URL=http://localhost:3000
```

如果使用 MongoDB Atlas，把 `MONGO_URI` 换成 Atlas 连接字符串，并确认网络访问权限允许当前电脑连接。

启动 FastAPI：

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

地址：

- API：<http://localhost:8000>
- 接口文档：<http://localhost:8000/docs>
- 基础检查：<http://localhost:8000/api/v1/health>
- MongoDB 检查：<http://localhost:8000/api/v1/health/mongodb>

macOS/Linux：

```bash
python3.12 -m venv backend/.venv
./backend/.venv/bin/python -m pip install -r backend/requirements.txt
./backend/.venv/bin/python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

## 同时启动前后端

完成安装和 `.env` 配置后，在仓库根目录执行：

```powershell
npm run dev
```

这会同时启动前端 3000 端口和后端 8000 端口。根目录的 `dev:backend` 脚本默认使用 `backend\.venv\Scripts\python.exe`，必须先创建虚拟环境。

## 前端连接后端

本地默认连接 `http://localhost:8000`。如需指定其他地址，在 `frontend/.env.local` 写入：

```dotenv
VITE_API_URL=http://localhost:8000
```

修改后需要重启 Vite。仓库中的 `frontend/.env.production` 指向线上演示 API，只用于生产构建。

## 验证启动

```powershell
Invoke-RestMethod http://localhost:8000/api/v1/health
```

然后打开 <http://localhost:3000>，依次检查商品列表、校区筛选和发布页面。后端连接正常后，再测试登录、收藏、购物车和订单。

## 常见问题

### 页面能打开但登录或商品同步失败

访问 `http://localhost:8000/api/v1/health/mongodb`。如果 `connected: false`，检查 MongoDB 服务和 `.env` 中的 `MONGO_URI`。

### 找不到后端虚拟环境

先确认自己位于仓库根目录，再按本机实际 Python 启动方式创建环境：

```powershell
py --list
where.exe python
```

如果列表中有 3.12：

```powershell
py -3.12 -m venv backend\.venv
```

如果列表显示的是 Astral/uv 的 CPython：

```powershell
py -V:Astral/CPython3.12.15 -m venv backend\.venv
```

然后：

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### `npm` 报 `ENOENT`，提示找不到 `package.json`

这是当前目录错误，不是前端代码错误。先回到仓库根目录，并确认 `Test-Path .\package.json` 返回 `True`，再重新执行安装命令。

### `py -3.12` 报无法识别 Python

这是本机 Python 启动器登记方式不同。按照“第一次安装”中的 `py --list` 和 `where.exe python` 检查结果选择对应命令；已有 `backend\.venv` 时直接复用它即可。

### 找不到 fastapi

必须使用项目虚拟环境安装：

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### `npm error code EALLOWSCRIPTS`

先从最新仓库重新同步代码，再重新安装前端依赖：

```powershell
git switch main
git pull origin main
npm install
npm run install:frontend
```

项目已经移除了前端对根目录 `file:..` 的无用循环依赖。这个依赖会让较新版本 npm 在安装前端时重复处理根项目，并触发依赖安装脚本安全策略。

如果仍然报同样的错误，检查本机是否在用户级或项目级 `.npmrc` 中强制设置了脚本参数：

```powershell
npm config get allow-scripts
npm config get ignore-scripts
npm config list
```

不要把 `--allow-scripts` 直接加到项目安装命令后面。先删除个人 `.npmrc` 中不需要的 `allow-scripts` 或 `ignore-scripts` 配置，再重新运行安装。

### 只想看界面，不想安装 MongoDB

```powershell
npm install
npm run install:frontend
npm run dev:frontend
```

此模式适合先查看页面；真实登录、商品写入、收藏和订单仍需后端和 MongoDB。

### 登录前的完整启动顺序

登录不是纯前端功能。需要两个终端都保持运行，并且后端能连接 MongoDB：

1. 终端一（仓库根目录）：`npm run dev:backend`
2. 终端二（仓库根目录）：`npm run dev:frontend`
3. 浏览器打开 <http://localhost:3000>，再进行注册或登录。
4. 若页面能打开但登录失败，先访问 <http://localhost:8000/api/v1/health> 和 <http://localhost:8000/api/v1/health/mongodb>，确认 API 和数据库均正常。

只运行 `npm run dev:frontend` 可以查看演示页面，但不能保证真实登录、发布、收藏和订单同步。

## 当前功能模块

- 商品浏览、搜索、分类和校区筛选
- 商品发布、收藏、购物车和订单演示
- 卖家管理和通知
- 书籍专区与校园书单入口
- 校园跑腿任务演示
- 金明、明伦校区地图和交接点
- CampusBot 校园助手演示

## 团队开发约定

每个人从 `main` 创建功能分支，完成小功能后提交 Pull Request。提交前执行：

```powershell
npm run build
.\backend\.venv\Scripts\python.exe -m compileall backend
```

## 来源与许可

本项目基于 [Sowmajit-Kar/CAMPUSCART](https://github.com/Sowmajit-Kar/CAMPUSCART) 进行二次开发，保留原项目 MIT License。新增的河南大学业务设计、界面、演示数据和功能实现由本项目组维护。
