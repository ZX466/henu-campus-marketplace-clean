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
    <div className="grid gap-0 overflow-hidden rounded-hero border border-[var(--border-soft)] bg-[var(--bg)] shadow-panel lg:grid-cols-[.9fr_1.1fr]">
      <div className="min-h-[280px] bg-[var(--surface)]"><img src={course.heroImage} alt="校园书单" className="img-in h-full w-full object-cover" loading="lazy" decoding="async" /></div>
      <div className="p-7 sm:p-12">
        <p className="eyebrow text-[var(--accent)]">专业书单与平台指南</p>
        <h1 className="mt-4 display-2">{course.title}</h1>
        <p className="mt-5 leading-8 text-[var(--muted)]">{course.subtitle}</p>
        <div className="mt-8 rounded-panel border border-[var(--border-soft)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white"><Sparkles size={18} /></div>
            <div>
              <p className="font-bold text-[var(--fg)]">{course.instructor.name}</p>
              <p className="text-xs text-[var(--fg-2)]">{course.instructor.role}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--fg-2)]">{course.instructor.bio}</p>
        </div>
        <button onClick={onEnroll} className="press mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"><BookOpen size={17} /> 提交专业书单建议</button>
      </div>
    </div>

    <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <div className="apple-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--accent)]">已认证起始书单</p>
            <h2 className="mt-3 display-3">今日专业书单</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">版本由买卖双方确认，先从课程和校区筛选。</p>
          </div>
          <BookOpen className="shrink-0 text-[var(--accent)]" />
        </div>
        {loadingBooks ? <div role="status" aria-label="正在加载书单" className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-[88px] rounded-card" />)}</div> : <div className="stagger mt-6 space-y-3">{booklists.map((book) => <div key={book.id} className="rounded-card border border-[var(--border-soft)] bg-[var(--surface)] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-bold text-[var(--fg)]">{book.title}</h3><p className="mt-1 text-xs text-[var(--muted)]">课程：{book.course}</p></div><span className="shrink-0 rounded-full bg-[var(--bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--fg-2)] ring-1 ring-[var(--border-soft)]">{book.campuses.join(" / ")}</span></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{book.description}</p></div>)}</div>}
      </div>

      <div className="on-ink rounded-panel bg-ink-950 p-6 text-white shadow-panel sm:p-8">
        <p className="eyebrow text-[var(--meta)]">规则解析助手</p>
        <h2 className="mt-3 display-3">智能求购解析</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--on-ink)]">输入专业、年级、课程、预算和校区，先确认解析结果，再发布求购。</p>
        <form onSubmit={handleWishSubmit} className="mt-6 space-y-3">
          <textarea value={wishText} onChange={(event) => setWishText(event.target.value)} maxLength={500} rows={4} placeholder="例如：我是2024级软件工程学生，想买数据库原理教材，预算50元，金明校区" className="w-full rounded-2xl border border-[var(--plate-line)] bg-[var(--plate-fill-strong)] p-4 text-sm text-white outline-none transition-colors placeholder:text-[var(--meta)] focus:border-[var(--accent-hover)]" />
          <button disabled={wishLoading || !wishText.trim()} className="press inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={16} />{wishLoading ? "解析中…" : "解析求购信息"}</button>
        </form>
        {wishResult && <div className="mt-6 rounded-2xl bg-[var(--plate-fill)] p-4 text-sm">{wishResult.error ? <p className="text-amber-200">{wishResult.error}</p> : <><div className="grid grid-cols-2 gap-4 text-[var(--on-ink-strong)]">{[["专业", wishResult.major], ["年级", wishResult.grade], ["课程", wishResult.course], ["预算上限", wishResult.budget_max ? `¥${wishResult.budget_max}` : null], ["校区", wishResult.campus]].map(([label, value]) => <div key={label}><span className="text-xs text-[var(--meta)]">{label}</span><p className="mt-1 font-bold text-white">{value || "待补充"}</p></div>)}</div>{wishResult.missing_fields?.length > 0 ? <p className="mt-4 text-xs text-amber-200">还需要补充：{wishResult.missing_fields.join("、")}</p> : <p className="mt-4 text-xs text-success-300">信息完整，请确认后继续发布求购。</p>}</>}</div>}
      </div>
    </div>

    <div className="mt-14">
      <p className="eyebrow text-[var(--accent)]">使用流程</p>
      <h2 className="mt-3 display-2">从发现到交接，四步完成</h2>
      <div className="stagger mt-8 grid gap-6 md:grid-cols-4">{[
        ["01", "选择校区和分类", "按金明、明伦校区以及书籍、数码、宿舍生活等分类浏览。", MapPin],
        ["02", "查看商品和卖家", "确认成色、价格、交接点和卖家信用信息。", CheckCircle2],
        ["03", "站内沟通细节", "确认时间、地点和交易方式，保留平台沟通记录。", MessageCircle],
        ["04", "当面验货完成交接", "在校园公共区域交接，双方确认后结束交易。", BookOpen]
      ].map(([number, title, desc, Icon]) => <div key={number} className="card-product reveal p-6"><span className="font-display text-sm font-bold tracking-widest text-[var(--accent)] tnum">/{number}</span><div className="mt-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--fg-2)]"><Icon size={18} /></div><h3 className="mt-4 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{desc}</p></div>)}</div>
    </div>
  </section>;
}
