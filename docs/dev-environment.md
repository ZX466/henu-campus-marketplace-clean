# 开发环境与数据库启动

> 周期一 · 沈鼎宸（Issue #11）。新电脑从零启动项目，照本文从上往下做即可。

## 1. 端口和配置位置

| 服务 | 地址 | 端口写在哪里 |
| --- | --- | --- |
| 前端（Vite） | http://localhost:3334 | `frontend/vite.config.js` |
| 后端（FastAPI） | http://localhost:8000 | `scripts/start-backend.cjs` |
| 接口文档（Swagger） | http://localhost:8000/docs | 随后端 |
| MongoDB | localhost:27017 | 根目录 `.env` 的 `MONGO_URI` |

后端只读仓库根目录的 `.env`（或 `backend/.env`），从哪个目录启动都一样。前端默认连 `http://localhost:8000`，需要改时才建 `frontend/.env.local`（样例：`frontend/.env.example`）。

## 2. 需要先装的软件

| 软件 | 版本 | 检查命令 |
| --- | --- | --- |
| Git | 任意 | `git --version` |
| Node.js | 18 及以上，推荐 20 LTS | `node --version` |
| Python | 3.10 及以上，推荐 3.12 | 不用手动检查，`npm run setup:backend` 会自动找 |
| MongoDB | 7 或 8，**必须是副本集模式** | 见第 4 节，三种方式选一种 |

为什么必须是副本集：下单和取消订单用了 MongoDB 多文档事务，单机模式的 MongoDB 能读写，但一下单就报 `Transaction numbers are only allowed on a replica set member or mongos`。Atlas 天生是副本集，不用处理。

## 3. 从零启动（所有命令都在仓库根目录执行）

```powershell
# 1. 克隆并进入仓库
git clone https://github.com/hwd-123456/henu-campus-marketplace-clean.git
cd henu-campus-marketplace-clean

# 2. 一次装好前端依赖和后端虚拟环境（自动查找本机 Python，找不到会用 uv 安装）
npm run setup

# 3. 生成配置文件，然后把 JWT_SECRET_KEY 改成自己的随机字符串
copy .env.example .env        # macOS/Linux：cp .env.example .env

# 4. 启动 MongoDB（第 4 节任选一种，这里以 Docker 为例）
npm run db:start

# 5. 启动前后端（开两个终端；或者一条命令 npm run dev）
npm run dev:backend
npm run dev:frontend

# 6. 另开一个终端做健康检查
npm run check:health
```

第 6 步全部显示 ✅ 就说明环境正常，打开 http://localhost:3334 即可使用。

`npm run setup` 只要跑一次。之后每次开发只需要第 4、5 步。

## 4. MongoDB 三种启动方式（任选一种）

### 方式 A：Docker（推荐，三个系统命令一样）

先安装并打开 Docker Desktop，然后：

```powershell
npm run db:start     # 第一次会下载 mongo:7 镜像，并自动初始化副本集 rs0
npm run db:status    # 查看状态
npm run db:stop      # 停止；数据留在 Docker 卷 campuscart-mongo-data 里
```

`.env` 保持样例里的 `MONGO_URI=mongodb://localhost:27017/?directConnection=true`。

### 方式 B：本机安装 MongoDB Community

**Windows**

1. 从 https://www.mongodb.com/try/download/community 下载 MSI，按默认选项安装为 Windows 服务，并勾选安装 MongoDB Compass（自带 mongosh）。
2. 用管理员身份打开 `C:\Program Files\MongoDB\Server\<版本>\bin\mongod.cfg`，在末尾加上：

   ```yaml
   replication:
     replSetName: rs0
   ```

3. 管理员 PowerShell 重启服务：`Restart-Service MongoDB`
4. 打开 mongosh（或 Compass 底部的 `>_MONGOSH`），执行一次：

   ```javascript
   rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})
   ```

**macOS（Homebrew）**

```bash
brew tap mongodb/brew && brew install mongodb-community@7.0
echo -e "replication:\n  replSetName: rs0" >> "$(brew --prefix)/etc/mongod.conf"
brew services start mongodb-community@7.0
mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

**Linux**：按官方文档安装后，同样在 `/etc/mongod.conf` 加 `replication.replSetName: rs0`，`sudo systemctl restart mongod`，再执行上面的 `rs.initiate`。

### 方式 C：MongoDB Atlas（云端，不用装软件）

1. 在 Atlas 建一个免费 M0 集群，Database Access 里建用户，Network Access 里加入本机 IP。
2. 复制连接串写进 `.env`：

   ```dotenv
   MONGO_URI=mongodb+srv://<用户名>:<密码>@<集群地址>/?retryWrites=true&w=majority
   ```

连接串里有密码，只能写在 `.env`，不要发到群里、截图或提交到 Git。

## 5. 环境变量（`.env.example`）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `APP_ENV` | `development` | 线上改成 `production`，会关闭清空商品的 `/api/v1/products/seed` 开发接口 |
| `MONGO_URI` | `mongodb://localhost:27017/?directConnection=true` | 本地/Docker 用默认值；Atlas 换成 `mongodb+srv://...` |
| `MONGO_DB_NAME` | `campuscart_db` | 数据库名 |
| `JWT_SECRET_KEY` | 样例里是占位符 | 登录 token 签名密钥，必须改成随机长字符串；后端启动时如果还是默认值会打印警告 |
| `FRONTEND_URL` | `http://localhost:3334` | 自动加入 CORS 白名单，部署后改成正式前端域名 |

生成随机密钥：`python -c "import secrets; print(secrets.token_urlsafe(48))"`

## 6. 健康检查

| 地址 | 正常结果 | 用途 |
| --- | --- | --- |
| `GET /api/v1/health` | `"status": "healthy"` | 后端进程是否在运行；部署平台的存活检查用这个 |
| `GET /api/v1/health/mongodb` | `"connected": true`、`"transactions_supported": true` | 数据库是否连通、能否下单 |

`/api/v1/health/mongodb` 的 `status` 有三种：

- `healthy`：连通，且是副本集，全部功能可用。
- `degraded`：连通但 MongoDB 是单机模式，浏览、登录正常，**下单会失败**，`hint` 字段写了怎么修。
- `unreachable`：连不上，`error` 是原因，`hint` 写了检查方向。返回内容不含连接串里的用户名和密码。

`npm run check:health` 会一次检查前端、后端、MongoDB，并打印两个接口的完整返回，可以直接贴到 Issue 或 PR 里当验收记录。

## 7. 常见问题

| 现象 | 处理 |
| --- | --- |
| `npm run setup:backend` 提示没找到 Python | 安装 Python 3.12，或安装 uv 后重试；也可以指定解释器：`$env:PYTHON="C:\路径\python.exe"; npm run setup:backend` |
| 健康检查 `degraded`，下单报 Transaction numbers… | MongoDB 不是副本集，按第 4 节加 `replSetName: rs0` 并执行一次 `rs.initiate` |
| `unreachable`，error 含 `ServerSelectionTimeoutError` | MongoDB 没启动，或 `.env` 的 `MONGO_URI` 写错；Docker 方式先确认 Docker Desktop 在运行 |
| 副本集初始化后连不上，error 含容器主机名 | `MONGO_URI` 末尾缺少 `?directConnection=true` |
| `npm run db:start` 提示端口 27017 被占用 | 本机已经装了 MongoDB 服务，方式 A 和 B 只保留一种 |
| 后端启动提示没找到 `.env` | 在仓库根目录执行第 3 节第 3 步复制样例 |
| 后端提示 JWT_SECRET_KEY 仍是默认值 | 本地开发可以忽略；部署前必须改 |
| 前端打开了但请求被浏览器拦截（CORS） | 前端必须从 3334 端口打开，或把实际地址写进 `.env` 的 `FRONTEND_URL` 后重启后端 |
