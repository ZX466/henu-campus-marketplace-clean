// mongo-docker.cjs — 用 Docker 一键启动本地 MongoDB（单节点副本集，支持事务）
//
// 用法（仓库根目录，需已安装并启动 Docker Desktop）：
//   npm run db:start    启动（第一次会下载 mongo:7 镜像并初始化副本集）
//   npm run db:stop     停止（数据保存在 Docker 卷 campuscart-mongo-data 里，不会丢）
//   npm run db:status   查看状态
//
// 对应的 .env：MONGO_URI=mongodb://localhost:27017/?directConnection=true
const { spawnSync } = require("node:child_process");

const NAME = "campuscart-mongo";
const IMAGE = "mongo:7";
const VOLUME = "campuscart-mongo-data";
const PORT = 27017;

function docker(args, inherit = false) {
  return spawnSync("docker", args, { encoding: "utf8", stdio: inherit ? "inherit" : "pipe" });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function mongosh(js) {
  return docker(["exec", NAME, "mongosh", "--quiet", "--eval", js]);
}

function containerState() {
  const r = docker(["inspect", "-f", "{{.State.Status}}", NAME]);
  return r.status === 0 ? r.stdout.trim() : null; // running / exited / null
}

function ensureDocker() {
  const r = docker(["version", "--format", "{{.Server.Version}}"]);
  if (r.error) {
    console.error("[失败] 没找到 docker 命令。请安装 Docker Desktop，或改用 docs/dev-environment.md 中的本地安装方式。");
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error("[失败] Docker 没有运行。请先打开 Docker Desktop，等它显示 Running 后重试。");
    process.exit(1);
  }
}

function start() {
  ensureDocker();
  const state = containerState();
  if (state === "running") {
    console.log(`容器 ${NAME} 已在运行。`);
  } else if (state) {
    console.log(`启动已有容器 ${NAME} ...`);
    if (docker(["start", NAME], true).status !== 0) process.exit(1);
  } else {
    console.log(`创建容器 ${NAME}（${IMAGE}，端口 ${PORT}，副本集 rs0）...`);
    const r = docker([
      "run", "-d", "--name", NAME,
      "-p", `${PORT}:27017`,
      "-v", `${VOLUME}:/data/db`,
      IMAGE, "--replSet", "rs0", "--bind_ip_all",
    ], true);
    if (r.status !== 0) {
      console.error(`[失败] 容器创建失败。若提示端口 ${PORT} 被占用，说明本机已有 MongoDB 在运行，二选一即可。`);
      process.exit(1);
    }
  }

  process.stdout.write("等待 MongoDB 就绪");
  for (let i = 0; i < 60; i++) {
    if (mongosh("db.adminCommand('ping').ok").stdout?.trim() === "1") break;
    process.stdout.write(".");
    sleep(1000);
    if (i === 59) {
      console.error(`\n[失败] 60 秒内没有就绪，查看日志：docker logs ${NAME}`);
      process.exit(1);
    }
  }
  console.log(" 就绪");

  // 副本集只需初始化一次；成员地址写 localhost，宿主机用 directConnection 直连
  const init = mongosh(
    "try { rs.status().ok } catch (e) { rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]}).ok }",
  );
  if (init.stdout?.trim() !== "1") {
    console.error("[失败] 副本集初始化失败：\n" + (init.stderr || init.stdout));
    process.exit(1);
  }
  for (let i = 0; i < 30; i++) {
    if (mongosh("db.hello().isWritablePrimary").stdout?.trim() === "true") break;
    sleep(1000);
  }

  console.log(`\n[完成] MongoDB 已在 localhost:${PORT} 运行（副本集 rs0，支持事务）。`);
  console.log("确认 .env 中：MONGO_URI=mongodb://localhost:27017/?directConnection=true");
}

function stop() {
  ensureDocker();
  if (!containerState()) {
    console.log(`没有名为 ${NAME} 的容器。`);
    return;
  }
  docker(["stop", NAME], true);
  console.log(`已停止 ${NAME}，数据保留在卷 ${VOLUME} 中。`);
}

function status() {
  ensureDocker();
  const state = containerState();
  if (!state) return console.log(`未创建（运行 npm run db:start）`);
  console.log(`容器 ${NAME}：${state}`);
  if (state === "running") {
    const r = mongosh("JSON.stringify({version: db.version(), replSet: db.hello().setName || null, primary: db.hello().isWritablePrimary})");
    console.log(r.stdout.trim() || r.stderr.trim());
  }
}

const cmd = process.argv[2];
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "status") status();
else {
  console.log("用法：node scripts/mongo-docker.cjs start|stop|status");
  process.exit(1);
}
