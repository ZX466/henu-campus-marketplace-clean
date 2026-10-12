import React from "react";
import { ArrowRight, BookOpen, Bot, MessageCircle, Package, Truck } from "lucide-react";
import CAMPUS_DATA from "../data/mockData";

export default function OverviewGatewayView({ isLoggedIn, onOpenLogin, onExplore, onEnterHome }) {
  const books = CAMPUS_DATA.products.filter((item) => item.category === "书籍").length;
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-28 sm:px-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> 河南大学 · 金明 / 明伦校区
            </span>
            <h1 className="mt-7 font-display text-5xl font-black tracking-tight sm:text-7xl">
              河大同享
              <span className="block text-emerald-400">校园二手交易与互助平台</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              让教材、专业书和校园闲置物品在同学之间继续流转。平台同时支持在线沟通、跑腿任务和专业书单智能推荐。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={onExplore} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">
                浏览商品 <ArrowRight size={17} />
              </button>
              <button onClick={isLoggedIn ? onEnterHome : onOpenLogin} className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">
                {isLoggedIn ? "进入我的校园" : "登录 / 注册"}
              </button>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["书籍商品", `${books}+`], ["校区", "2"], ["安全交接点", "6"], ["平台服务", "7×24"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="text-2xl font-black">{value}</div>
                <div className="mt-1 text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">第一版核心模块</p>
            <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">围绕书籍交易，连接校园生活</h2>
          </div>
          <button onClick={onExplore} className="text-sm font-bold text-slate-700 hover:text-emerald-600">查看全部功能 →</button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [BookOpen, "书籍优先", "教材、考研资料和专业书单集中展示，按专业和校区快速查找。", "bg-blue-50 text-blue-600"],
            [Package, "二手物品", "数码、宿舍用品、出行工具等闲置物品都可以发布和交换。", "bg-amber-50 text-amber-600"],
            [MessageCircle, "在线沟通", "买家、卖家和跑腿同学在平台内沟通，确认时间和交接地点。", "bg-violet-50 text-violet-600"],
            [Truck, "校园跑腿", "代取快递、代送资料、打印占座等任务可以发布、接单和确认。", "bg-emerald-50 text-emerald-600"]
          ].map(([Icon, title, description, color]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={"flex h-11 w-11 items-center justify-center rounded-2xl " + color}><Icon size={21} /></div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">CampusCart AI</p>
            <h2 className="mt-3 font-display text-3xl font-black sm:text-5xl">不知道买什么书？<br />让智能推荐先给你一份书单。</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-500">输入专业、年级和课程，平台根据人工维护的河南大学专业书单和校园商品进行推荐。第一版采用随机推荐，后续逐步加入收藏和浏览偏好。</p>
            <button onClick={onExplore} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">试试书籍专区 <Bot size={17} /></button>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950"><Bot size={20} /></div>
              <div><p className="font-bold">河大书单助手</p><p className="text-xs text-slate-400">AI 推荐演示</p></div>
              <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">在线</span>
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">我是你的校园书单助手。告诉我专业和课程，我会从金明、明伦校区的书籍中随机推荐。</div>
            <div className="mt-3 rounded-2xl bg-emerald-400 p-4 text-sm font-semibold text-slate-950">例如：给我推荐一套软件工程专业大二教材</div>
          </div>
        </div>
      </section>
    </main>
  );
}
