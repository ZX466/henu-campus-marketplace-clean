import React from "react";
import { ArrowRight, BookOpen, Bot, MessageCircle, Package, Truck } from "lucide-react";
import CAMPUS_DATA from "../data/mockData";

export default function OverviewGatewayView({ isLoggedIn, onOpenLogin, onExplore, onEnterHome }) {
  const books = CAMPUS_DATA.products.filter((item) => item.category === "书籍").length;
  const showcase = CAMPUS_DATA.products.slice(0, 2);

  const features = [
    [BookOpen, "书籍优先", "教材、考研资料和专业书单集中展示，按专业和校区快速查找。", "bg-[var(--surface)] text-[var(--fg-2)]"],
    [Package, "二手物品", "数码、宿舍用品、出行工具等闲置物品都可以发布和交换。", "bg-[var(--surface)] text-[var(--fg-2)]"],
    [MessageCircle, "在线沟通", "买家、卖家和跑腿同学在平台内沟通，确认时间和交接地点。", "bg-[var(--surface)] text-[var(--fg-2)]"],
    [Truck, "校园跑腿", "代取快递、代送资料、打印占座等任务可以发布、接单和确认。", "bg-[var(--surface)] text-[var(--fg-2)]"]
  ];

  const featureSpans = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4"];
  const stats = [["书籍商品", `${books}+`], ["校区", "2"], ["安全交接点", "6"], ["平台服务", "7×24"]];

  return (
    <main className="min-h-screen bg-[var(--surface-warm)] text-[var(--fg)]">
      {/* HERO */}
      <section className="on-ink hero-light relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute -bottom-28 left-1/2 -translate-x-1/2 select-none opacity-[0.05]">
          <span className="font-display text-[28vw] font-black leading-none tracking-tighter whitespace-nowrap">河大同享</span>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-10 pt-36 sm:px-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div className="max-w-2xl animate-hero-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--plate-line-strong)] bg-[var(--plate-fill-strong)] px-4 py-2 text-xs font-semibold text-[var(--on-ink-strong)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-ring" /> 河南大学 · 金明 / 明伦校区
            </span>
            <h1 className="mt-8 display-1">
              河大同享
              <span className="mt-3 block display-3 text-[var(--meta)]">校园二手交易与互助平台</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--on-ink)] sm:text-lg">
              让教材、专业书和校园闲置物品在同学之间继续流转。平台同时支持在线沟通、跑腿任务和专业书单智能推荐。
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={onExplore} className="press btn-pill group">
                浏览商品 <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button onClick={isLoggedIn ? onEnterHome : onOpenLogin} className="press inline-flex items-center gap-2 rounded-full border border-[var(--plate-line-strong)] bg-[var(--plate-fill-strong)] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--plate-fill-stronger)]">
                {isLoggedIn ? "进入我的校园" : "登录 / 注册"}
              </button>
            </div>
          </div>

          <div className="plate-dark animate-hero-in p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-[var(--on-ink)]">今日校园 · 精选</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--plate-fill-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--on-ink-strong)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-ring" /> 实时更新
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {showcase.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-card bg-[var(--plate-fill)] p-3 ring-1 ring-[var(--plate-line)] transition-colors hover:bg-[var(--plate-fill-strong)]">
                  <img src={item.image} alt={item.title} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" decoding="async" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--on-ink-soft)]">{item.category} · {item.campus}</p>
                  </div>
                  <span className="price tnum text-base text-white">¥{item.price}</span>
                </div>
              ))}
            </div>
            <button onClick={onExplore} className="press mt-5 flex w-full items-center justify-center gap-2 rounded-field bg-[var(--plate-fill-strong)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--plate-fill-stronger)]">
              进入交易大厅 <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-12">
          <div className="grid grid-cols-2 gap-y-8 border-t border-[var(--plate-line)] pt-8 sm:grid-cols-4">
            {stats.map(([label, value], index) => (
              <div key={label} className={"sm:pl-6 " + (index > 0 ? "sm:border-l sm:border-[var(--plate-line)]" : "")}>
                <div className="font-display text-3xl font-black tracking-tight tnum sm:text-4xl">{value}</div>
                <div className="mt-2 text-xs font-medium tracking-wide text-[var(--meta)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-12">
        <div className="section-head">
          <div>
            <p className="eyebrow text-[var(--accent)]">第一版核心模块</p>
            <h2 className="mt-3 display-2">围绕书籍交易，连接校园生活</h2>
          </div>
          <button onClick={onExplore} className="text-sm font-bold text-[var(--fg-2)] transition-colors hover:text-[var(--accent)]">查看全部功能 →</button>
        </div>
        <div className="bento mt-12">
          {features.map(([Icon, title, description, color], index) => (
            <div key={title} className={"bento-tile lift reveal p-7 " + featureSpans[index]}>
              <div className="flex items-start justify-between gap-4">
                <div className={"flex h-12 w-12 items-center justify-center rounded-2xl " + color}><Icon size={22} /></div>
                <span className="font-display text-sm font-bold tracking-widest text-[var(--border)] tnum">/0{index + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
              <p className="mt-2.5 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI */}
      <section className="border-y border-[var(--border-soft)] bg-[var(--bg)] px-6 py-24 sm:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div className="reveal">
            <p className="eyebrow text-[var(--accent)]">河大同享 AI</p>
            <h2 className="mt-4 display-2">
              不知道买什么书？<br />让智能推荐先给你一份书单。
            </h2>
            <p className="mt-6 max-w-xl leading-7 text-[var(--muted)]">
              输入专业、年级和课程，平台根据人工维护的河南大学专业书单和校园商品进行推荐。第一版采用随机推荐，后续逐步加入收藏和浏览偏好。
            </p>
            <button onClick={onExplore} className="press btn-pill mt-8">
              试试书籍专区 <Bot size={17} />
            </button>
          </div>
          <div className="plate-dark reveal rounded-hero p-7 text-white shadow-panel">
            <div className="flex items-center gap-3 border-b border-[var(--plate-line)] pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white"><Bot size={20} /></div>
              <div>
                <p className="font-bold">河大书单助手</p>
                <p className="text-xs text-[var(--meta)]">AI 推荐演示</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--plate-fill-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--on-ink-strong)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> 在线
              </span>
            </div>
            <div className="mt-6 rounded-2xl bg-[var(--plate-fill)] p-4 text-sm leading-6 text-[var(--on-ink-strong)]">
              我是你的校园书单助手。告诉我专业和课程，我会从金明、明伦校区的书籍中随机推荐。
            </div>
            <div className="mt-3 rounded-2xl bg-[var(--accent)] p-4 text-sm font-semibold text-white">
              例如：给我推荐一套软件工程专业大二教材
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
