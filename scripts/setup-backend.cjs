// setup-backend.cjs — 跨平台创建 backend/.venv 并安装后端依赖
//
// 用法（仓库根目录）：npm run setup:backend
//
// 查找 Python 的顺序（需要 3.10 及以上，推荐 3.12）：
//   1. 环境变量 PYTHON 指定的解释器
//   2. Windows: py -3.12 / py -3 / python / uv 安装的 Python（%APPDATA%\uv\python）
//      macOS/Linux: python3.12 / python3 / python
//   3. 都找不到但装了 uv：用 uv 自动下载 Python 3.12
const { existsSync, readdirSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { spawnSync } = require("node:child_process");

const isWin = process.platform === "win32";
const root = resolve(__dirname, "..");
const venvDir = resolve(root, "backend", ".venv");
const venvPython = isWin
  ? join(venvDir, "Scripts", "python.exe")
  : join(venvDir, "bin", "python");
const requirements = resolve(root, "backend", "requirements.txt");

const MIN = [3, 10];

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", cwd: root, ...opts });
}

function step(cmd, args) {
  console.log(`\n> ${[cmd, ...args].join(" ")}`);
  const r = run(cmd, args, { stdio: "inherit" });
  if (r.error || r.status !== 0) {
    console.error(`\n[失败] 命令执行出错：${[cmd, ...args].join(" ")}`);
    process.exit(1);
  }
}

// 返回 [major, minor] 或 null
function pythonVersion(cmd, args = []) {
  const r = run(cmd, [...args, "-c", "import sys; print('%d.%d' % sys.version_info[:2])"]);
  if (r.error || r.status !== 0) return null;
  const m = (r.stdout || "").trim().match(/^(\d+)\.(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function okVersion(v) {
  return v && (v[0] > MIN[0] || (v[0] === MIN[0] && v[1] >= MIN[1]));
}

function uvPythons() {
  // uv python install 下载的解释器（Windows 上不会登记到 py 启动器）
  const base = isWin && process.env.APPDATA ? join(process.env.APPDATA, "uv", "python") : null;
  if (!base || !existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => /^cpython-3\.\d+/.test(d))
    .sort((a, b) => (a.includes("cpython-3.12") ? -1 : b.includes("cpython-3.12") ? 1 : b.localeCompare(a)))
    .map((d) => [join(base, d, "python.exe"), []])
    .filter(([exe]) => existsSync(exe));
}

function findPython() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
  if (isWin) {
    candidates.push(["py", ["-3.12"]], ["py", ["-3"]], ["python", []], ...uvPythons());
  } else {
    candidates.push(["python3.12", []], ["python3", []], ["python", []]);
  }
  for (const [cmd, args] of candidates) {
    const v = pythonVersion(cmd, args);
    if (okVersion(v)) return { cmd, args, version: v.join(".") };
  }
  return null;
}

function hasUv() {
  const r = run("uv", ["--version"]);
  return !r.error && r.status === 0;
}

// ---------- 1. 创建虚拟环境 ----------
let createdWithUv = false;
const existing = existsSync(venvPython) ? pythonVersion(venvPython) : null;

if (okVersion(existing)) {
  console.log(`已存在 backend/.venv（Python ${existing.join(".")}），直接复用。`);
} else {
  const py = findPython();
  if (py) {
    console.log(`使用 Python ${py.version}：${[py.cmd, ...py.args].join(" ")}`);
    // 已有但版本不对或损坏的 .venv 用 --clear 重建
    step(py.cmd, [...py.args, "-m", "venv", ...(existsSync(venvDir) ? ["--clear"] : []), venvDir]);
  } else if (hasUv()) {
    console.log("没找到 3.10+ 的 Python，改用 uv 自动安装 Python 3.12。");
    step("uv", ["venv", "--python", "3.12", venvDir]);
    createdWithUv = true;
  } else {
    console.error(
      "[失败] 没找到 Python 3.10 及以上版本。\n" +
        "请安装 Python 3.12（https://www.python.org/downloads/），或安装 uv 后重试；\n" +
        "也可以用环境变量指定解释器，例如：PYTHON=C:\\path\\to\\python.exe npm run setup:backend",
    );
    process.exit(1);
  }
}

// ---------- 2. 安装依赖 ----------
const pipOk = !run(venvPython, ["-m", "pip", "--version"]).status;
if (!createdWithUv && pipOk) {
  step(venvPython, ["-m", "pip", "install", "--disable-pip-version-check", "-r", requirements]);
} else if (hasUv()) {
  // uv 创建的虚拟环境默认不带 pip
  step("uv", ["pip", "install", "-r", requirements, "--python", venvPython]);
} else {
  step(venvPython, ["-m", "ensurepip", "--upgrade"]);
  step(venvPython, ["-m", "pip", "install", "--disable-pip-version-check", "-r", requirements]);
}

// ---------- 3. 校验 ----------
const check = run(venvPython, ["-c", "import fastapi, motor, pydantic_settings, uvicorn; print(fastapi.__version__)"]);
if (check.status !== 0) {
  console.error("[失败] 依赖安装后仍无法导入 fastapi / motor，请把上面的输出发到群里。");
  process.exit(1);
}

console.log(`\n[完成] 后端环境就绪：Python ${pythonVersion(venvPython).join(".")}，FastAPI ${check.stdout.trim()}`);
if (!existsSync(resolve(root, ".env"))) {
  console.log("下一步：把仓库根目录的 .env.example 复制为 .env（见 README 第 3 步）。");
}
console.log("启动后端：npm run dev:backend");
