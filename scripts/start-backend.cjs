// start-backend.cjs — 跨平台启动 FastAPI 后端（端口 8000）
// 用法（仓库根目录）：npm run dev:backend
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawn } = require("node:child_process");

const PORT = "8000";
const root = resolve(__dirname, "..");
const python = process.platform === "win32"
  ? resolve(root, "backend", ".venv", "Scripts", "python.exe")
  : resolve(root, "backend", ".venv", "bin", "python");

if (!existsSync(python)) {
  console.error(`找不到项目虚拟环境：${python}`);
  console.error("请先在仓库根目录运行：npm run setup:backend");
  process.exit(1);
}

if (!existsSync(resolve(root, ".env")) && !existsSync(resolve(root, "backend", ".env"))) {
  console.warn("⚠️  没找到 .env，将使用默认配置（MongoDB 连 localhost:27017）。");
  console.warn("   建议先复制：Windows 用 copy .env.example .env；macOS/Linux 用 cp .env.example .env\n");
}

const child = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--reload-dir", "backend", "--host", "127.0.0.1", "--port", PORT, "--app-dir", "backend"],
  { cwd: root, stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
