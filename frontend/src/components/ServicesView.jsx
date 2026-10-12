import React, { useMemo, useState } from "react";
import { ArrowRight, MapPin, Plus, Search, Truck } from "lucide-react";

const starterTasks = [
  { id: "task-1", title: "帮忙从北门快递点取一个小包裹", campus: "金明校区", location: "北门快递点 → 生活服务中心", time: "今天 18:00 前", reward: 3, note: "物品不重，取件码私聊提供。", status: "待接单" },
  { id: "task-2", title: "帮忙送一本教材到明伦校区", campus: "明伦校区", location: "大礼堂东门附近", time: "今天下午", reward: 5, note: "书籍已装袋，时间可以协商。", status: "待接单" },
  { id: "task-3", title: "代打印课程资料并送到图书馆", campus: "金明校区", location: "图书馆一楼大厅", time: "明天上午", reward: 4, note: "约 20 页黑白打印，打印费用另付。", status: "待接单" }
];

export default function ServicesSection({ onBook }) {
  const [tasks, setTasks] = useState(starterTasks);
  const [campusFilter, setCampusFilter] = useState("全部校区");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", campus: "金明校区", location: "", time: "", reward: "", note: "" });
  const [message, setMessage] = useState("");
  const filteredTasks = useMemo(() => tasks.filter((task) =>
    (campusFilter === "全部校区" || task.campus === campusFilter) &&
    (task.title + task.location + task.note).toLowerCase().includes(query.toLowerCase())
  ), [tasks, campusFilter, query]);

  const publishTask = (event) => {
    event.preventDefault();
    const task = { ...draft, id: `task-${Date.now()}`, reward: Number(draft.reward) || 0, status: "待接单" };
    setTasks((current) => [task, ...current]);
    setCampusFilter("全部校区");
    setIsFormOpen(false);
    setDraft({ title: "", campus: "金明校区", location: "", time: "", reward: "", note: "" });
    setMessage("任务已添加到本页演示列表。连接后端后即可保存并让其他同学接单。");
    window.setTimeout(() => setMessage(""), 4200);
  };

  const requestTask = (task) => {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "沟通中" } : item));
    onBook?.(task.title);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><Truck size={14} /> 金明 / 明伦校区跑腿互助</span>
            <h1 className="mt-5 font-display text-4xl font-black sm:text-5xl">校园跑腿任务广场</h1>
            <p className="mt-4 leading-7 text-slate-300">发布代取快递、代送物品、打印资料等需求。任务报酬由发布者填写，双方通过站内沟通确认时间、地点和具体事项。</p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300"><Plus size={18} /> 发布跑腿任务</button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索代取快递、送书、打印资料…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500" />
        </label>
        <div className="flex gap-2">
          {["全部校区", "金明校区", "明伦校区"].map((campus) => <button key={campus} onClick={() => setCampusFilter(campus)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${campusFilter === campus ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{campus}</button>)}
        </div>
      </div>

      {message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">当前任务 <span className="ml-2 text-sm font-medium text-slate-400">{filteredTasks.length} 条</span></h2>
        <span className="text-xs text-slate-400">演示任务数据</span>
      </div>
      {filteredTasks.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {filteredTasks.map((task) => <article key={task.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><MapPin size={14} />{task.campus}</div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${task.status === "待接单" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{task.status}</span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">{task.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{task.note}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs">
            <div><span className="text-slate-400">交接地点</span><p className="mt-1 font-semibold text-slate-700">{task.location || "沟通确认"}</p></div>
            <div><span className="text-slate-400">期望时间</span><p className="mt-1 font-semibold text-slate-700">{task.time || "沟通确认"}</p></div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-slate-500">报酬 <strong className="ml-1 text-xl text-slate-950">¥{task.reward}</strong></p>
            <button disabled={task.status !== "待接单"} onClick={() => requestTask(task)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-500">{task.status === "待接单" ? "联系并接单" : "已发起沟通"} <ArrowRight size={15} /></button>
          </div>
        </article>)}
      </div> : <div className="mt-5 rounded-3xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">没有找到符合条件的任务。</div>}

      {isFormOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
        <form onSubmit={publishTask} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">发布需求</p><h2 className="mt-2 text-2xl font-black">新增跑腿任务</h2></div><button type="button" onClick={() => setIsFormOpen(false)} className="text-2xl leading-none text-slate-400">×</button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-semibold">任务内容<input required maxLength={80} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="例如：帮忙从快递点取一个包裹" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-semibold">校区<select value={draft.campus} onChange={(e) => setDraft({ ...draft, campus: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"><option>金明校区</option><option>明伦校区</option></select></label>
            <label className="text-sm font-semibold">报酬（元）<input type="number" min="0" max="500" value={draft.reward} onChange={(e) => setDraft({ ...draft, reward: e.target.value })} placeholder="例如：3" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-semibold">交接地点<input required value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="填写校内地点" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-semibold">期望时间<input required value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} placeholder="例如：今天 18:00 前" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="sm:col-span-2 text-sm font-semibold">补充说明<textarea rows="3" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="请说明物品大小、取件方式或其他要求" className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-emerald-500" /></label>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">当前为网页演示，新增内容仅保存在本次页面会话中。</p>
          <button type="submit" className="mt-5 w-full rounded-xl bg-slate-950 py-3.5 font-bold text-white hover:bg-slate-800">发布任务</button>
        </form>
      </div>}
    </section>
  );
}
