// check-health.cjs — 一条命令检查前端、后端、MongoDB 是否都在正常运行
//
// 用法（仓库根目录，前后端启动之后）：npm run check:health
// 可选环境变量：API_URL（默认 http://localhost:8000）、FRONTEND_URL（默认 http://localhost:3334）
const API_URL = (process.env.API_URL || "http://localhost:8000").replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3334").replace(/\/$/, "");

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* 前端首页返回 HTML */
    }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "超时" : e.cause?.code || e.message };
  } finally {
    clearTimeout(timer);
  }
}

function line(mark, name, detail) {
  console.log(`${mark} ${name.padEnd(28)} ${detail}`);
}

(async () => {
  console.log(`检查时间：${new Date().toLocaleString()}`);
  console.log(`Node ${process.version} | ${process.platform}\n`);

  const [front, health, mongo] = await Promise.all([
    get(`${FRONTEND_URL}/`),
    get(`${API_URL}/api/v1/health`),
    get(`${API_URL}/api/v1/health/mongodb`),
  ]);

  let failed = false;

  if (front.ok) line("✅", `前端 ${FRONTEND_URL}`, `HTTP ${front.status}`);
  else {
    failed = true;
    line("❌", `前端 ${FRONTEND_URL}`, front.error || `HTTP ${front.status}`);
  }

  if (health.ok) line("✅", "后端 /api/v1/health", `${health.body.status} | 环境 ${health.body.environment ?? "-"}`);
  else {
    failed = true;
    line("❌", "后端 /api/v1/health", health.error || `HTTP ${health.status}`);
  }

  const m = mongo.ok ? mongo.body : null;
  if (m && m.connected) {
    const mark = m.transactions_supported ? "✅" : "⚠️ ";
    line(mark, "MongoDB /api/v1/health/mongodb",
      `connected | ${m.topology}${m.replica_set ? `(${m.replica_set})` : ""} | v${m.server_version} | 商品 ${m.products_count} 件`);
    if (!m.transactions_supported) {
      failed = true;
      console.log(`   ${m.hint}`);
    }
  } else {
    failed = true;
    line("❌", "MongoDB /api/v1/health/mongodb", m ? `connected=false：${m.error}` : mongo.error || `HTTP ${mongo.status}`);
    if (m?.hint) console.log(`   ${m.hint}`);
  }

  console.log("\n--- /api/v1/health ---");
  console.log(JSON.stringify(health.body ?? { error: health.error }, null, 2));
  console.log("--- /api/v1/health/mongodb ---");
  console.log(JSON.stringify(mongo.body ?? { error: mongo.error }, null, 2));

  console.log(failed ? "\n结果：有未通过的检查，按上面的提示处理。" : "\n结果：前端、后端、MongoDB 全部正常。");
  process.exit(failed ? 1 : 0);
})();
