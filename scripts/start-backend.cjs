const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawn } = require("node:child_process");

const root = resolve(__dirname, "..");
const candidates = process.platform === "win32"
  ? [resolve(root, "backend", ".venv", "Scripts", "python.exe")]
  : [resolve(root, "backend", ".venv", "bin", "python")];

const python = candidates.find((file) => existsSync(file));

if (!python) {
  const venvPath = process.platform === "win32"
    ? "backend\\.venv\\Scripts\\python.exe"
    : "backend/.venv/bin/python";
  console.error(`找不到项目虚拟环境：${venvPath}`);
  console.error("请先阅读 README，创建 backend/.venv 并安装 backend/requirements.txt。");
  process.exit(1);
}

const child = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--app-dir", "backend"],
  { cwd: root, stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
