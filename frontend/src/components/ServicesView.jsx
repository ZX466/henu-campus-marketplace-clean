import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, MapPin, Plus, Search, Truck } from "lucide-react";

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

const STATUS_META = {
  待接单: { className: "bg-amber-50 text-amber-700" },
  已接单: { className: "bg-blue-50 text-blue-700" },
  已完成: { className: "bg-emerald-50 text-emerald-700" }
};

const CAMPUS_OPTIONS = ["全部校区", "金明校区", "明伦校区"];

export default function ServicesSection({ onNotify }) {
  const [tasks, setTasks] = useState(loadTasks);
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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // 忽略本地存储写入失败，页面仍然可用
    }
  }, [tasks]);

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

  const publishTask = (event) => {
    event.preventDefault();
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
    setTasks((current) => [task, ...current]);
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
    setMessage("任务已发布并保存到本机，刷新页面后仍然保留。");
    onNotify?.("跑腿任务已发布，已保存到本机。");
    window.setTimeout(() => setMessage(""), 4200);
  };

  const acceptTask = (task) => {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: "已接单" } : item
      )
    );
    onNotify?.(`已接单：「${task.title}」`);
  };

  const completeTask = (task) => {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: "已完成" } : item
      )
    );
    onNotify?.(`任务已完成：「${task.title}」`);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Truck size={14} /> 金明 / 明伦校区跑腿互助
            </span>
            <h1 className="mt-5 font-display text-4xl font-black sm:text-5xl">
              校园跑腿任务广场
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              发布代取快递、代送物品、打印资料等需求。发布后可在本页接单、标记完成，任务与状态保存在本机，刷新页面后仍会保留。
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300"
          >
            <Plus size={18} /> 发布跑腿任务
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索代取快递、送书、打印资料…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <div className="flex gap-2">
          {CAMPUS_OPTIONS.map((campus) => (
            <button
              key={campus}
              onClick={() => setCampusFilter(campus)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                campusFilter === campus
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {campus}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </p>
      )}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          当前任务{" "}
          <span className="ml-2 text-sm font-medium text-slate-400">
            {filteredTasks.length} 条
          </span>
        </h2>
        <span className="text-xs text-slate-400">任务与状态保存在本机</span>
      </div>

      {filteredTasks.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredTasks.map((task) => {
            const statusMeta = STATUS_META[task.status] || STATUS_META["待接单"];
            return (
              <article
                key={task.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <MapPin size={14} />
                    {task.campus}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}
                  >
                    {task.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {task.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {task.note || "暂无补充说明。"}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs">
                  <div>
                    <span className="text-slate-400">起点</span>
                    <p className="mt-1 font-semibold text-slate-700">
                      {task.start || "沟通确认"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">终点</span>
                    <p className="mt-1 font-semibold text-slate-700">
                      {task.end || "沟通确认"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">截止时间</span>
                    <p className="mt-1 font-semibold text-slate-700">
                      {formatDeadline(task.deadline)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    报酬{" "}
                    <strong className="ml-1 text-xl text-slate-950">
                      ¥{task.reward}
                    </strong>
                  </p>
                  {task.status === "待接单" && (
                    <button
                      onClick={() => acceptTask(task)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      接单 <ArrowRight size={15} />
                    </button>
                  )}
                  {task.status === "已接单" && (
                    <button
                      onClick={() => completeTask(task)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
                    >
                      标记完成 <CheckCircle2 size={15} />
                    </button>
                  )}
                  {task.status === "已完成" && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
                      已完成 <CheckCircle2 size={15} />
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">
          没有找到符合条件的任务。
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={publishTask}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                  发布需求
                </p>
                <h2 className="mt-2 text-2xl font-black">新增跑腿任务</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-2xl leading-none text-slate-400"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-semibold">
                标题
                <input
                  required
                  maxLength={80}
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="例如：帮忙从快递点取一个包裹"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-sm font-semibold">
                校区
                <select
                  value={draft.campus}
                  onChange={(event) => updateDraft("campus", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-sm font-semibold">
                起点
                <input
                  required
                  value={draft.start}
                  onChange={(event) => updateDraft("start", event.target.value)}
                  placeholder="例如：北门快递点"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-sm font-semibold">
                终点
                <input
                  required
                  value={draft.end}
                  onChange={(event) => updateDraft("end", event.target.value)}
                  placeholder="例如：生活服务中心"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-sm font-semibold">
                截止时间
                <input
                  required
                  type="datetime-local"
                  value={draft.deadline}
                  onChange={(event) => updateDraft("deadline", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
              <label className="sm:col-span-2 text-sm font-semibold">
                备注
                <textarea
                  rows="3"
                  value={draft.note}
                  onChange={(event) => updateDraft("note", event.target.value)}
                  placeholder="请说明物品大小、取件方式或其他要求"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              当前为前端闭环演示，任务与状态仅保存在本机，后续将接入后端 API。
            </p>
            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-slate-950 py-3.5 font-bold text-white hover:bg-slate-800"
            >
              发布任务
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
