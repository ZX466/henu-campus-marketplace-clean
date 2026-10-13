# 河大同享

河南大学金明校区、明伦校区校园二手交易与互助平台。第一版是网页应用，书籍交易是重点，同时包含商品发布、搜索筛选、收藏、购物车、订单、校园跑腿和校园助手等功能。

## 先看网页演示

如果只是先查看网页界面，可以只启动前端。没有 MongoDB 时，页面仍会显示内置演示商品；后端登录接口支持临时本地回退，便于联调登录页面，但注册、发布、收藏、订单和数据持久化仍需要 MongoDB。

启动后访问：<http://localhost:3334>

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

如果还没有项目文件，先克隆仓库：

```powershell
git clone https://github.com/hwd-123456/henu-campus-marketplace-clean.git
cd henu-campus-marketplace-clean
```

所有 `npm`、`git` 和后端启动命令都要在仓库根目录执行，也就是能同时看到 `package.json`、`frontend` 和 `backend` 的目录。不要在桌面目录直接运行 `npm install`。

Windows PowerShell 示例：

```powershell
cd .\henu-campus-marketplace-clean
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
& "<python.exe 的完整路径>" -m venv backend\.venv
```

创建完成后，再执行上面的虚拟环境依赖安装命令。不要在桌面目录直接执行 `backend\\.venv` 路径命令；必须先进入仓库根目录。

## 使用 uv 启动（推荐）

[uv](https://docs.astral.sh/uv/) 是更快的 Python 包管理器，可自动管理 Python 版本和虚拟环境。先确认 uv 已安装：

```powershell
uv --version
```

没有 uv 时安装：

```powershell
pip install uv
```

### uv 版启动步骤

在仓库根目录依次执行：

1. 创建虚拟环境（uv 会自动选择合适的 Python 版本）：

```powershell
uv venv backend\.venv
```

2. 安装后端依赖：

```powershell
uv pip install -r backend\requirements.txt --python backend\.venv\Scripts\python.exe
```

3. 在仓库根目录新建 `.env`（内容见下方"启动后端 API"）：

```powershell
New-Item .env
```

4. 启动后端：

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

5. 另开一个终端启动前端：

```powershell
npm install
npm run install:frontend
npm run dev:frontend
```

6. 浏览器打开 <http://localhost:3334>。

macOS/Linux 的 uv 版：

```bash
uv venv backend/.venv
uv pip install -r backend/requirements.txt --python backend/.venv/bin/python
./backend/.venv/bin/python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

### uv 与普通 Python 版的对应关系

| 步骤 | uv 版 | 普通 Python 版 |
| --- | --- | --- |
| 创建虚拟环境 | `uv venv backend\.venv` | `py -3.12 -m venv backend\.venv` |
| 安装依赖 | `uv pip install -r backend\requirements.txt --python backend\.venv\Scripts\python.exe` | `.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` |
| 启动后端 | 相同：`.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir backend` | 相同 |
| 启动前端 | 相同：`npm run dev:frontend` | 相同 |

虚拟环境结构完全一致，两种方式任选其一，后续启动命令没有区别。

## 只启动前端查看页面

```powershell
npm run dev:frontend
```

打开 <http://localhost:3334>。端口在 `frontend/vite.config.js` 中固定为 3334。需要换端口时运行：

```powershell
npm --prefix frontend run dev -- --port 3001
```

## 启动后端 API

在仓库根目录新建 `.env`：

```dotenv
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=campuscart_db
JWT_SECRET_KEY=请替换为本地随机字符串
FRONTEND_URL=http://localhost:3334
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

这会同时启动前端 3334 端口和后端 8000 端口。根目录的 `dev:backend` 会自动选择 Windows 的 `backend\.venv\Scripts\python.exe` 或 macOS/Linux 的 `backend/.venv/bin/python`，必须先创建虚拟环境。

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

然后打开 <http://localhost:3334>，依次检查商品列表、校区筛选和发布页面。后端连接正常后，再测试登录、收藏、购物车和订单。

## 常见问题

### 页面能打开但登录或商品同步失败

访问 `http://localhost:8000/api/v1/health/mongodb`。如果 `connected: false`，检查 MongoDB 服务和 `.env` 中的 `MONGO_URI`。

没有 MongoDB 时，登录接口可能返回 `Authenticated (Local Fallback)` 并成功建立临时登录态；重启后端后该登录态和数据不会保留。注册接口以及依赖数据库写入的功能需要先恢复 MongoDB 连接。

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

项目已经移除了前端对根目录 `file:..` 的无用循环依赖。前端 `package.json` 已明确允许 Vite 需要的 `esbuild` 安装脚本运行，避免 npm 11 把它拦截。

如果仍然报同样的错误，检查本机是否在用户级或项目级 `.npmrc` 中强制设置了脚本参数：

```powershell
npm config get allow-scripts
npm config get ignore-scripts
npm config list
```

不要把 `--allow-scripts` 直接加到项目安装命令后面；项目级安装应由仓库中的 `allowScripts` 配置管理。如果仍被个人 `.npmrc` 覆盖，先检查并删除不需要的 `allow-scripts` 或 `ignore-scripts` 配置，再重新运行安装。

### `npm error Exit handler never called!`

这是 npm 自己在安装结束时没有正常收尾，常见原因是 npm 11 的兼容性问题、网络超时、代理或当前 npm 镜像异常，不是项目源代码报错。npm 社区中也有 Windows、Node 24/npm 11 和网络重试触发此错误的记录。

先关闭正在运行的前端、后端和其他 npm 进程，然后在仓库根目录执行：

```powershell
node --version
npm --version
npm config get registry
npm cache verify
```

如果当前 Node.js 是 24.x、npm 是 11.x，优先换用 Node.js 20 LTS（自带 npm 10），再重新打开 PowerShell。若暂时不能更换 Node，也可以尝试只为这次安装切换官方 registry：

```powershell
npm install --registry=https://registry.npmjs.org
npm --prefix frontend install --registry=https://registry.npmjs.org
```

如果仍然失败，清理缓存和未完成的依赖目录后再装。不要删除 `package-lock.json`：

```powershell
Remove-Item -Recurse -Force .\node_modules, .\frontend\node_modules -ErrorAction SilentlyContinue
npm cache clean --force
npm install --registry=https://registry.npmjs.org
npm --prefix frontend install --registry=https://registry.npmjs.org
```

如果公司、校园网或代理必须使用指定镜像，应把完整的 npm 调试日志和 `npm config get registry` 的结果一起发给网络管理员；不要把个人代理、证书或账号配置提交到仓库。

### 安装时显示 `10 vulnerabilities`

这是 npm 对依赖树的安全审计提示，不等于安装失败。先运行：

```powershell
npm audit
```

可以先使用不破坏主版本的修复：

```powershell
npm audit fix
```

如果 `npm audit` 报 `audit endpoint ... NOT_IMPLEMENTED`，通常是当前 npm 镜像没有提供审计接口，不代表项目安装失败。临时切换到 npm 官方审计接口：

```powershell
npm audit --registry=https://registry.npmjs.org
```

不要直接使用 `npm audit fix --force`，它可能升级 React、Vite 等主版本并破坏当前项目。若审计仍有高危项，把 `npm audit` 的具体依赖路径发给项目负责人后再单独升级。

### 一键复制的标准安装顺序

从仓库根目录开始，依次执行：

```powershell
npm install
npm run install:frontend
npm run build
npm run dev
```

如果只看前端，把最后一行换成 `npm run dev:frontend`。如果 `npm run dev` 提示虚拟环境不存在，先按“第一次安装”创建 `backend/.venv`。

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
3. 浏览器打开 <http://localhost:3334>，再进行注册或登录。
4. 若页面能打开但登录失败，先访问 <http://localhost:8000/api/v1/health> 和 <http://localhost:8000/api/v1/health/mongodb>，确认 API 和数据库均正常。

只运行 `npm run dev:frontend` 可以查看演示页面，但不能保证真实登录、发布、收藏和订单同步。

### 商品图片加载失败或出现 `ERR_TUNNEL_CONNECTION_FAILED`

演示商品图片使用 Unsplash 等外部图片地址。网络无法访问这些站点时，页面仍可启动和登录，但部分商品图片会显示失败；这不是登录接口或前端构建错误。可以切换网络，或后续将图片替换为项目本地静态资源。

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
