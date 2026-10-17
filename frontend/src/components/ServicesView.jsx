import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, MapPin, Plus, Search, Truck } from "lucide-react";
import {
  claimErrand,
  completeErrand,
  createErrand,
  fetchErrands,
} from "../services/api";

const STORAGE_KEY = "campus-errand-tasks-v1";

const starterTasks = [
  {
    id: "task-1",
    title: "帮忙从北门快递点取一个小包裹",
    campus: "金明校区",
    start: "北门快递点",
    end: "生活服务中心",
    deadline: "2026-10-14T18:00",
    reward: 3,
    note: "物品不重，取件码私聊提供。",
    status: "待接单"
  },
  {
    id: "task-2",
    title: "帮忙送一本教材到明伦校区",
    campus: "明伦校区",
    start: "大礼堂东门",
    end: "图书馆",
    deadline: "2026-10-14T17:30",
    reward: 5,
    note: "书籍已装袋，时间可以协商。",
    status: "待接单"
  },
  {
    id: "task-3",
    title: "代打印课程资料并送到图书馆",
    campus: "金明校区",
    start: "东门打印店",
    end: "图书馆一楼大厅",
    deadline: "2026-10-15T10:00",
    reward: 4,
    note: "约 20 页黑白打印，打印费用另付。",
    status: "待接单"
  }
];

function loadTasks() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // 本地存储不可用时退回演示数据
  }
  return starterTasks;
}

function formatDeadline(value) {
  if (!value) return "沟通确认";
  return value.replace("T", " ");
}

function normalizeTask(task) {
  const status = {
    open: "待接单",
    claimed: "已接单",
    completed: "已完成",
  }[task.status] || task.status || "待接单";
  return {
    ...task,
    id: task.id || task.task_id,
    task_id: task.task_id || task.id,
    start: task.start || task.origin || "",
    end: task.end || task.destination || "",
    deadline: task.deadline || "",
    status,
  };
}

const STATUS_META = {
  待接单: { className: "bg-amber-50 text-amber-800 ring-amber-200" },
  已接单: { className: "bg-success-50 text-success-600 ring-success-200" },
  已完成: { className: "bg-success-100 text-success-700 ring-success-200" }
};

const CAMPUS_OPTIONS = ["全部校区", "金明校区", "明伦校区"];

export default function ServicesSection({ onNotify, isLoggedIn = false, onRequireLogin }) {
  const [tasks, setTasks] = useState(loadTasks);
  const [dataSource, setDataSource] = useState("local");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [campusFilter, setCampusFilter] = useState("全部校区");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    campus: "金明校区",
    start: "",
    end: "",
    deadline: "",
    reward: "",
    note: ""
  });

  /**
   * 从后端拉取跑腿列表。发布成功后也调它刷新，避免只把新任务插在本地。
   * isCancelled 让卸载后的请求结果不会写进已卸载组件的 state。
   */
  const loadTasks = async (isCancelled = () => false) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await fetchErrands();
      if (isCancelled()) return;
      if (result.success) {
        setTasks(result.tasks.map(normalizeTask));
        setDataSource("server");
        setMessage("");
      } else {
        setLoadError(result.error || "后端跑腿接口暂不可用。");
        setMessage("后端跑腿接口暂不可用，当前显示本地演示数据。");
      }
    } catch (error) {
      if (isCancelled()) return;
      setLoadError(error?.message || "后端跑腿接口暂不可用。");
      setMessage("后端跑腿接口暂不可用，当前显示本地演示数据。");
    } finally {
      if (!isCancelled()) setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadTasks(() => cancelled);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (dataSource !== "local") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // 忽略本地存储写入失败，页面仍然可用
    }
  }, [tasks, dataSource]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (campusFilter === "全部校区" || task.campus === campusFilter) &&
          `${task.title} ${task.start} ${task.end} ${task.note}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [tasks, campusFilter, query]
  );

  const updateDraft = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const publishTask = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin?.();
      onNotify?.("请先登录后再发布跑腿任务。");
      return;
    }
    const task = {
      id: `task-${Date.now()}`,
      title: draft.title.trim(),
      campus: draft.campus,
      start: draft.start.trim(),
      end: draft.end.trim(),
      deadline: draft.deadline,
      reward: Number(draft.reward) || 0,
      note: draft.note.trim(),
      status: "待接单"
    };
    if (dataSource === "server") {
      const result = await createErrand({
        campus: task.campus,
        title: task.title,
        origin: task.start,
        destination: task.end,
        reward: task.reward,
        deadline: task.deadline || null,
        note: task.note || null,
      });
      if (!result.success) {
        onNotify?.(`发布失败：${result.error}`);
        return;
      }
      // 周期二：发布成功后重新拉服务端数据，避免本地和库里的列表不一致
      await loadTasks();
    } else {
      setTasks((current) => [task, ...current]);
    }
    setCampusFilter("全部校区");
    setIsFormOpen(false);
    setDraft({
      title: "",
      campus: "金明校区",
      start: "",
      end: "",
      deadline: "",
      reward: "",
      note: ""
    });
    setMessage(dataSource === "server" ? "任务已发布到后端。" : "任务已发布并保存到本机。");
    onNotify?.(dataSource === "server" ? "跑腿任务已发布。" : "跑腿任务已保存到本机。");
    window.setTimeout(() => setMessage(""), 4200);
  };

  const acceptTask = async (task) => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      onNotify?.("请先登录后再接单。");
      return;
    }
    if (dataSource === "server") {
      const result = await claimErrand(task.task_id || task.id);
      if (!result.success) {
        onNotify?.(`接单失败：${result.error}`);
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? normalizeTask(result.task) : item));
      onNotify?.(`已接单：「${task.title}」`);
      return;
    }
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: "已接单" } : item
      )
    );
    onNotify?.(`已接单：「${task.title}」`);
  };

  const completeTask = async (task) => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      onNotify?.("请先登录后再标记完成。");
      return;
    }
    if (dataSource === "server") {
      const result = await completeErrand(task.task_id || task.id);
      if (!result.success) {
        onNotify?.(`完成失败：${result.error}`);
        return;
      }
      setTasks((current) => current.map((item) => item.id === task.id ? normalizeTask(result.task) : item));
      onNotify?.(`任务已完成：「${task.title}」`);
      return;
    }
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: "已完成" } : item
      )
    );
    onNotify?.(`任务已完成：「${task.title}」`);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
      <div className="hero-light overflow-hidden rounded-hero bg-ink-950 p-7 text-white shadow-panel sm:p-12">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--plate-line-strong)] bg-[var(--plate-fill-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--on-ink-strong)] backdrop-blur">
              <Truck size={14} /> 金明 / 明伦校区跑腿互助
            </span>
            <h1 className="mt-5 display-2">
              校园跑腿任务广场
            </h1>
            <p className="mt-4 leading-8 text-[var(--on-ink)]">
              发布代取快递、代送物品、打印资料等需求。后端可用时任务会同步保存，离线时保留本地演示流程。
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="press inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
          >
            <Plus size={18} /> 发布跑腿任务
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--meta)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索代取快递、送书、打印资料…"
            className="w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] py-3 pl-11 pr-4 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
          />
        </label>
        <div className="flex gap-2">
          {CAMPUS_OPTIONS.map((campus) => (
            <button
              key={campus}
              onClick={() => setCampusFilter(campus)}
              className={`press rounded-field px-4 py-3 text-sm font-semibold transition-colors ${
                campusFilter === campus
                  ? "bg-[var(--accent)] text-white shadow-card"
                  : "bg-[var(--bg)] text-[var(--fg-2)] ring-1 ring-[var(--border-soft)] hover:bg-[var(--surface)] hover:ring-[var(--border)] active:bg-[var(--border-soft)]"
              }`}
            >
              {campus}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="mt-5 rounded-field border border-[var(--border-soft)] bg-[var(--surface)] p-4 text-sm font-medium text-[var(--fg-2)]">
          {message}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-[var(--fg)]">
          当前任务{" "}
          <span className="ml-2 text-sm font-medium text-[var(--meta)] tnum">
            {filteredTasks.length} 条
          </span>
        </h2>
        <span className="text-xs text-[var(--meta)] tnum">{dataSource === "server" ? "数据来自后端" : "本地演示数据"}</span>
      </div>

      {filteredTasks.length ? (
        <div className="stagger mt-6 grid gap-6 lg:grid-cols-2">
          {filteredTasks.map((task) => {
            const statusMeta = STATUS_META[task.status] || STATUS_META["待接单"];
            return (
              <article
                key={task.id}
                className="lift flex flex-col rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-6 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fg-2)]">
                    <MapPin size={14} />
                    {task.campus}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusMeta.className}`}
                  >
                    {task.status}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-[var(--fg)]">
                  {task.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {task.note || "暂无补充说明。"}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 rounded-card bg-[var(--surface)] p-4 text-xs">
                  <div>
                    <span className="text-[var(--meta)]">起点</span>
                    <p className="mt-1 font-semibold text-[var(--fg-2)]">
                      {task.start || "沟通确认"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--meta)]">终点</span>
                    <p className="mt-1 font-semibold text-[var(--fg-2)]">
                      {task.end || "沟通确认"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--meta)]">截止时间</span>
                    <p className="mt-1 font-semibold text-[var(--fg-2)]">
                      {formatDeadline(task.deadline)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--border-soft)] pt-5">
                  <p className="text-sm text-[var(--muted)]">
                    报酬{" "}
                    <strong className="ml-1 font-display text-2xl text-[var(--fg)] tnum">
                      ¥{task.reward}
                    </strong>
                  </p>
                  {task.status === "待接单" && (
                    <button
                      onClick={() => acceptTask(task)}
                      className="press inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
                    >
                      接单 <ArrowRight size={15} />
                    </button>
                  )}
                  {task.status === "已接单" && (
                    <button
                      onClick={() => completeTask(task)}
                      className="press inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
                    >
                      标记完成 <CheckCircle2 size={15} />
                    </button>
                  )}
                  {task.status === "已完成" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-success-50 px-5 py-2.5 text-sm font-bold text-success-600">
                      已完成 <CheckCircle2 size={15} />
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-panel border border-dashed border-[var(--border)] bg-[var(--surface-warm)] py-16 text-center text-sm font-medium text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          没有找到符合条件的任务。
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={publishTask}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-6 shadow-float animate-scale-in sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-[var(--accent)]">
                  发布需求
                </p>
                <h2 className="mt-2 display-3 text-[var(--fg)]">新增跑腿任务</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-xl leading-none text-[var(--muted)] transition-colors hover:bg-[var(--border-soft)] hover:text-[var(--fg)] active:bg-[var(--border)]"
                aria-label="关闭发布窗口"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">
                标题
                <input
                  required
                  maxLength={80}
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="例如：帮忙从快递点取一个包裹"
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-semibold">
                校区
                <select
                  value={draft.campus}
                  onChange={(event) => updateDraft("campus", event.target.value)}
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors hover:border-[var(--border)] focus:border-[var(--accent)]"
                >
                  <option>金明校区</option>
                  <option>明伦校区</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                报酬（元）
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={draft.reward}
                  onChange={(event) => updateDraft("reward", event.target.value)}
                  placeholder="例如：3"
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-semibold">
                起点
                <input
                  required
                  value={draft.start}
                  onChange={(event) => updateDraft("start", event.target.value)}
                  placeholder="例如：北门快递点"
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-semibold">
                终点
                <input
                  required
                  value={draft.end}
                  onChange={(event) => updateDraft("end", event.target.value)}
                  placeholder="例如：生活服务中心"
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-semibold">
                截止时间
                <input
                  required
                  type="datetime-local"
                  value={draft.deadline}
                  onChange={(event) => updateDraft("deadline", event.target.value)}
                  className="mt-2 w-full rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                备注
                <textarea
                  rows="3"
                  value={draft.note}
                  onChange={(event) => updateDraft("note", event.target.value)}
                  placeholder="请说明物品大小、取件方式或其他要求"
                  className="mt-2 w-full resize-y rounded-field border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-3 font-normal text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--border)] focus:border-[var(--accent)]"
                />
              </label>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--meta)]">
              {dataSource === "server" ? "任务会保存到后端，其他登录用户可以看到并接单。" : "后端不可用时使用本地演示数据，启动后端并登录即可同步。"}
            </p>
            <button
              type="submit"
              className="press mt-5 w-full rounded-full bg-[var(--accent)] py-3.5 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
            >
              发布任务
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
