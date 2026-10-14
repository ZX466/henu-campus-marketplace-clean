import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { CAMPUS_DATA } from "../data/mockData";
import { fetchBooklists, parseBookWish } from "../services/api";

export default function CourseSection({ onEnroll }) {
  const { course } = CAMPUS_DATA;
  const [booklists, setBooklists] = useState([]);
  const [wishText, setWishText] = useState("");
  const [wishResult, setWishResult] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [wishLoading, setWishLoading] = useState(false);

  useEffect(() => {
    fetchBooklists().then((result) => {
      if (result.success) setBooklists(result.items);
      setLoadingBooks(false);
    });
  }, []);

  async function handleWishSubmit(event) {
    event.preventDefault();
    if (!wishText.trim()) return;
    setWishLoading(true);
    const result = await parseBookWish(wishText.trim());
    setWishResult(result.success ? result.data : { error: result.error });
    setWishLoading(false);
  }

  return <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
    <div className="grid gap-10 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[.9fr_1.1fr]">
      <div className="min-h-[300px] bg-slate-100"><img src={course.heroImage} alt="校园书单" className="h-full w-full object-cover" /></div>
      <div className="p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">专业书单与平台指南</p><h1 className="mt-3 text-4xl font-black">{course.title}</h1><p className="mt-5 leading-7 text-slate-500">{course.subtitle}</p><div className="mt-8 rounded-2xl bg-blue-50 p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Sparkles size={18} /></div><div><p className="font-bold text-blue-950">{course.instructor.name}</p><p className="text-xs text-blue-700">{course.instructor.role}</p></div></div><p className="mt-4 text-sm leading-6 text-blue-900/70">{course.instructor.bio}</p></div><button onClick={onEnroll} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"><BookOpen size={17} /> 提交专业书单建议</button></div>
    </div>
    <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">已认证起始书单</p><h2 className="mt-2 text-2xl font-black">今日专业书单</h2><p className="mt-2 text-sm text-slate-500">版本由买卖双方确认，先从课程和校区筛选。</p></div><BookOpen className="text-blue-600" /></div>
        {loadingBooks ? <p className="mt-8 text-sm text-slate-400">正在加载书单…</p> : <div className="mt-6 space-y-3">{booklists.map((book) => <div key={book.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{book.title}</h3><p className="mt-1 text-xs text-slate-500">课程：{book.course}</p></div><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">{book.campuses.join(" / ")}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{book.description}</p></div>)}</div>}
      </div>
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">规则解析助手</p><h2 className="mt-2 text-2xl font-black">智能求购解析</h2><p className="mt-2 text-sm leading-6 text-slate-300">输入专业、年级、课程、预算和校区，先确认解析结果，再发布求购。</p>
        <form onSubmit={handleWishSubmit} className="mt-6 space-y-3"><textarea value={wishText} onChange={(event) => setWishText(event.target.value)} maxLength={500} rows={4} placeholder="例如：我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区" className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-400" /><button disabled={wishLoading || !wishText.trim()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={16} />{wishLoading ? "解析中…" : "解析求购信息"}</button></form>
        {wishResult && <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm">{wishResult.error ? <p className="text-amber-200">{wishResult.error}</p> : <><div className="grid grid-cols-2 gap-3 text-slate-200">{[["专业", wishResult.major], ["年级", wishResult.grade], ["课程", wishResult.course], ["预算上限", wishResult.budget_max ? `¥${wishResult.budget_max}` : null], ["校区", wishResult.campus]].map(([label, value]) => <div key={label}><span className="text-xs text-slate-400">{label}</span><p className="mt-1 font-bold text-white">{value || "待补充"}</p></div>)}</div>{wishResult.missing_fields?.length > 0 ? <p className="mt-4 text-xs text-amber-200">还需要补充：{wishResult.missing_fields.join("、")}</p> : <p className="mt-4 text-xs text-emerald-200">信息完整，请确认后继续发布求购。</p>}</>}</div>}
      </div>
    </div>
    <div className="mt-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">使用流程</p><h2 className="mt-2 text-3xl font-black">从发现到交接，四步完成</h2><div className="mt-7 grid gap-4 md:grid-cols-4">{[["01", "选择校区和分类", "按金明、明伦校区以及书籍、数码、宿舍生活等分类浏览。", MapPin], ["02", "查看商品和卖家", "确认成色、价格、交接点和卖家信用信息。", CheckCircle2], ["03", "站内沟通细节", "确认时间、地点和交易方式，保留平台沟通记录。", MessageCircle], ["04", "当面验货完成交接", "在校园公共区域交接，双方确认后结束交易。", BookOpen]].map(([number, title, desc, Icon]) => <div key={number} className="rounded-3xl border border-slate-200 bg-white p-6"><span className="font-mono text-sm font-bold text-emerald-600">/{number}</span><div className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon size={18} /></div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p></div>)}</div></div>
  </section>;
}
