import React, { useMemo, useState } from "react";
import { ArrowRight, Bot, BookOpen, MessageCircle, Package, RefreshCw, Truck } from "lucide-react";

export default function HomrPageIdeaView({ products = [], onExplore, onAddToCart, onOpenSeller, onStartChat, onOpenQr }) {
  const [campus, setCampus] = useState("全部校区");
  const [recommendation, setRecommendation] = useState(null);
  const books = products.filter((item) => item.category === "书籍");
  const visible = products.filter((item) => campus === "全部校区" || item.campus === campus).slice(0, 4);
  const recommendBook = () => {
    if (!books.length) return;
    setRecommendation(books[Math.floor(Math.random() * books.length)]);
  };

  const cards = [
    [BookOpen, "书籍专区", "教材、考研资料、四六级资料和专业书，优先服务高频交易需求。", "bg-[var(--surface)] text-[var(--fg-2)]", onExplore],
    [Package, "二手物品", "数码、宿舍用品、出行工具等校园闲置物品。", "bg-[var(--surface)] text-[var(--fg-2)]", onExplore],
    [MessageCircle, "站内沟通", "买家、卖家和跑腿同学在平台内协商细节。", "bg-[var(--surface)] text-[var(--fg-2)]", () => onExplore?.()],
    [Truck, "跑腿互助", "代取快递、送书、打印资料等需求可以发布和接单。", "bg-[var(--surface)] text-[var(--fg-2)]", () => window.location.assign("/services")]
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-warm)] px-6 pb-24 pt-32 sm:px-12">
      <section className="on-ink hero-light mx-auto max-w-7xl overflow-hidden rounded-hero bg-ink-950 p-7 text-white shadow-panel sm:p-12">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl animate-hero-in">
            <p className="eyebrow text-[var(--meta)]">我的校园 · 第一版工作台</p>
            <h1 className="mt-5 display-2">今天想找点什么？</h1>
            <p className="mt-5 max-w-xl leading-8 text-[var(--on-ink)]">先从书籍开始，也可以浏览二手物品、联系卖家，或者发布一条跑腿需求。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onExplore} className="press btn-pill">进入交易大厅 <ArrowRight size={17} /></button>
              <button onClick={() => window.location.assign("/services")} className="press rounded-full border border-[var(--plate-line-strong)] bg-[var(--plate-fill-strong)] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[var(--plate-fill-stronger)]">发布跑腿任务</button>
            </div>
          </div>
          <div className="plate-dark w-full max-w-sm p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white"><Bot size={20} /></div>
              <div><p className="font-bold">随机书籍推荐</p><p className="text-xs text-[var(--meta)]">第一版推荐算法演示</p></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--on-ink)]">按照当前书籍商品随机推荐，后续可以接入专业、年级、收藏和浏览记录。</p>
            {recommendation ? <div className="mt-5 rounded-card bg-[var(--bg)] p-4 text-[var(--fg)] shadow-card"><p className="eyebrow text-[var(--accent)]">今天推荐</p><p className="mt-2 font-bold">{recommendation.title}</p><p className="mt-1 text-xs text-[var(--fg-2)] tnum">¥{recommendation.price} · {recommendation.campus}</p></div> : null}
            <button onClick={recommendBook} className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--plate-fill-strong)] py-3 text-sm font-bold transition-colors hover:bg-[var(--plate-fill-stronger)]"><RefreshCw size={15} /> {recommendation ? "换一本推荐" : "开始推荐"}</button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl">
        <div className="section-head">
          <div>
            <p className="eyebrow text-[var(--accent)]">校园功能</p>
            <h2 className="mt-3 display-3">围绕真实需求组织服务</h2>
          </div>
          <div className="flex gap-2">{["全部校区", "金明校区", "明伦校区"].map((item) => <button key={item} onClick={() => setCampus(item)} className={`press rounded-full px-4 py-2 text-xs font-bold transition-colors ${campus === item ? "bg-ink-950 text-white" : "bg-[var(--bg)] text-[var(--muted)] ring-1 ring-[var(--border-soft)] hover:ring-[var(--border)]"}`}>{item}</button>)}</div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(([Icon, title, text, color, action]) => <button key={title} onClick={action} className="card-product reveal group p-6 text-left"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={20} /></div><h3 className="mt-6 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[var(--fg-2)] transition-colors group-hover:text-[var(--accent)]">查看功能 <ArrowRight size={13} /></span></button>)}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl">
        <div className="section-head">
          <div>
            <p className="eyebrow text-[var(--accent)]">精选商品</p>
            <h2 className="mt-3 display-3">{campus === "全部校区" ? "校园最新发布" : campus + "最新发布"}</h2>
          </div>
          <button onClick={onExplore} className="shrink-0 text-sm font-bold text-[var(--fg-2)] transition-colors hover:text-[var(--accent)]">查看全部 →</button>
        </div>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <article key={item.id} className="card-product reveal group">
              <button onClick={onExplore} className="block aspect-[4/3] w-full overflow-hidden bg-[var(--surface)]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
              </button>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="eyebrow text-[var(--accent)]">{item.category}</span>
                    <h3 className="mt-1.5 font-bold leading-snug">{item.title}</h3>
                  </div>
                  <span className="price whitespace-nowrap text-lg">¥{item.price}</span>
                </div>
                <p className="mt-3 text-xs text-[var(--meta)]">📍 {item.campus}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => onAddToCart?.(item)} className="press flex-1 rounded-field bg-ink-950 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--fg-2)]">加入清单</button>
                  <button onClick={() => onStartChat?.(item.seller, item)} className="press rounded-field bg-[var(--surface)] px-3 text-[var(--fg-2)] transition-colors hover:bg-[var(--border-soft)]" aria-label="联系卖家"><MessageCircle size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
