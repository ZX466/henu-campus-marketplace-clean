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
    [BookOpen, "书籍专区", "教材、考研资料、四六级资料和专业书，优先服务高频交易需求。", "bg-blue-50 text-blue-600", onExplore],
    [Package, "二手物品", "数码、宿舍用品、出行工具等校园闲置物品。", "bg-amber-50 text-amber-600", onExplore],
    [MessageCircle, "站内沟通", "买家、卖家和跑腿同学在平台内协商细节。", "bg-violet-50 text-violet-600", () => onExplore?.()],
    [Truck, "跑腿互助", "代取快递、送书、打印资料等需求可以发布和接单。", "bg-emerald-50 text-emerald-600", () => window.location.assign("/services")]
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-24 pt-32 sm:px-12">
      <section className="mx-auto max-w-7xl rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">我的校园 · 第一版工作台</p>
            <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">今天想找点什么？</h1>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">先从书籍开始，也可以浏览二手物品、联系卖家，或者发布一条跑腿需求。</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={onExplore} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300">进入交易大厅 <ArrowRight size={17} /></button>
              <button onClick={() => window.location.assign("/services")} className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold hover:bg-white/15">发布跑腿任务</button>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400 text-slate-950"><Bot size={20} /></div><div><p className="font-bold">随机书籍推荐</p><p className="text-xs text-slate-400">第一版推荐算法演示</p></div></div>
            <p className="mt-5 text-sm leading-6 text-slate-300">按照当前书籍商品随机推荐，后续可以接入专业、年级、收藏和浏览记录。</p>
            {recommendation ? <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900"><p className="text-xs font-bold text-blue-600">今天推荐</p><p className="mt-2 font-bold">{recommendation.title}</p><p className="mt-1 text-xs text-slate-500">¥{recommendation.price} · {recommendation.campus}</p></div> : null}
            <button onClick={recommendBook} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold hover:bg-white/15"><RefreshCw size={15} /> {recommendation ? "换一本推荐" : "开始推荐"}</button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">校园功能</p><h2 className="mt-2 text-3xl font-black">围绕真实需求组织服务</h2></div>
          <div className="flex gap-2">{["全部校区", "金明校区", "明伦校区"].map((item) => <button key={item} onClick={() => setCampus(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${campus === item ? "bg-slate-950 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{item}</button>)}</div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(([Icon, title, text, color, action]) => <button key={title} onClick={action} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={20} /></div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-slate-700">查看功能 <ArrowRight size={13} /></span></button>)}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl">
        <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">精选商品</p><h2 className="mt-2 text-2xl font-black">{campus === "全部校区" ? "校园最新发布" : campus + "最新发布"}</h2></div><button onClick={onExplore} className="text-sm font-bold text-slate-600 hover:text-emerald-600">查看全部 →</button></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><button onClick={onExplore} className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" /></button><div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold text-emerald-600">{item.category}</span><h3 className="mt-1 font-bold">{item.title}</h3></div><span className="text-lg font-black">¥{item.price}</span></div><p className="mt-3 text-xs text-slate-500">📍 {item.campus}</p><div className="mt-4 flex gap-2"><button onClick={() => onAddToCart?.(item)} className="flex-1 rounded-xl bg-slate-950 py-2.5 text-xs font-bold text-white hover:bg-slate-800">加入清单</button><button onClick={() => onStartChat?.(item.seller, item)} className="rounded-xl bg-slate-100 px-3 text-slate-700 hover:bg-slate-200"><MessageCircle size={15} /></button></div></div></article>)}
        </div>
      </section>
    </main>
  );
}
