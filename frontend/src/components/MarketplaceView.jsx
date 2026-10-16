import React, { useMemo, useState } from "react";
import { ArrowLeft, Heart, MapPin, MessageCircle, Package, Search, ShieldCheck, ShoppingCart } from "lucide-react";

export default function MarketplaceFullView({
  products = [], onAddToCart, onOpenSeller, onStartChat, onOpenQr, onSellItem,
  onAddToWishlist, onRemoveFromWishlist, wishlistItems = [], initialProduct = null
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [campus, setCampus] = useState("全部校区");
  const [mode, setMode] = useState("全部");
  const [selected, setSelected] = useState(initialProduct);
  const categories = useMemo(() => ["全部", ...new Set(products.map((item) => item.category))], [products]);
  const filtered = useMemo(() => products.filter((item) => {
    const text = [item.title, item.description, item.category, item.seller?.name].join(" ").toLowerCase();
    return (!query || text.includes(query.toLowerCase())) &&
      (category === "全部" || item.category === category) &&
      (campus === "全部校区" || item.campus === campus) &&
      (mode === "全部" || item.mode === mode);
  }), [products, query, category, campus, mode]);

  if (selected) {
    const isSaved = wishlistItems.some((item) => item.id === selected.id);
    return <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
      <button onClick={() => setSelected(null)} className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--fg)]"><ArrowLeft size={16} /> 返回商品列表</button>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-hero border border-[var(--border-soft)] bg-[var(--surface)] shadow-card"><img src={selected.image} alt={selected.title} className="img-in h-full w-full object-cover" loading="lazy" decoding="async" /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink-950 px-3 py-1 text-xs font-bold text-white">{selected.category}</span>
            <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-600">{selected.condition}</span>
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--fg-2)]">{selected.campus}</span>
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-[var(--accent)]">校园商品详情</p>
              <h1 className="mt-3 display-2">{selected.title}</h1>
            </div>
            <button onClick={() => isSaved ? onRemoveFromWishlist?.(selected.id) : onAddToWishlist?.(selected)} className={`press shrink-0 rounded-full p-3 transition-colors ${isSaved ? "bg-danger-50 text-[var(--danger)] hover:bg-danger-100" : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border-soft)]"}`} aria-label={isSaved ? "取消收藏" : "加入心愿单"}><Heart size={20} fill={isSaved ? "currentColor" : "none"} /></button>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="price text-4xl">¥{selected.price}</span>
            {selected.originalPrice ? <span className="text-lg text-[var(--meta)] line-through">¥{selected.originalPrice}</span> : null}
          </div>
          <p className="mt-6 leading-7 text-[var(--fg-2)]">{selected.description}</p>
          <div className="mt-6 rounded-panel border border-[var(--border-soft)] bg-[var(--surface)] p-5">
            <p className="eyebrow text-[var(--meta)]">建议交接点</p>
            <p className="mt-2 flex items-center gap-2 font-semibold"><MapPin size={16} className="text-[var(--accent)]" /> {selected.pickupLocation}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={() => onAddToCart?.(selected)} className="press inline-flex items-center justify-center gap-2 rounded-field bg-[var(--accent)] py-3.5 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"><ShoppingCart size={17} /> 加入交易清单</button>
            <button onClick={() => onStartChat?.(selected.seller, selected)} className="press inline-flex items-center justify-center gap-2 rounded-field bg-[var(--surface)] py-3.5 font-bold text-[var(--fg)] transition-colors hover:bg-[var(--border-soft)]"><MessageCircle size={17} /> 联系卖家</button>
            <button onClick={() => onOpenQr?.(selected)} className="press rounded-field border border-[var(--accent)] bg-transparent py-3.5 font-bold text-[var(--accent)] transition-colors hover:bg-[var(--surface)]">生成交接凭证</button>
            <button onClick={() => onOpenSeller?.(selected.seller)} className="press rounded-field border border-[var(--border)] bg-transparent py-3.5 font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)]">查看卖家信息</button>
          </div>
        </div>
      </div>
    </section>;
  }

  return <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
    <div className="flex flex-col justify-between gap-5 border-b border-[var(--border-soft)] pb-8 lg:flex-row lg:items-end">
      <div>
        <p className="eyebrow text-[var(--accent)]">金明 · 明伦校区</p>
        <h1 className="mt-3 display-2">校园交易大厅</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">书籍是重点，也可以发布数码、宿舍用品和出行工具。交易细节通过站内沟通确认。</p>
      </div>
      <button onClick={onSellItem} className="press shrink-0 self-start rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] lg:self-auto">＋ 发布商品</button>
    </div>

    <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto_auto]">
      <label className="relative block">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--meta)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索教材、专业书、耳机、宿舍用品…" className="w-full rounded-field border border-[var(--border)] bg-[var(--bg)] py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--meta)] focus:border-[var(--accent)]" />
      </label>
      <select value={campus} onChange={(e) => setCampus(e.target.value)} className="rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"><option>全部校区</option><option>金明校区</option><option>明伦校区</option></select>
      <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"><option value="全部">全部方式</option><option value="BUY">购买</option><option value="RENT">租用</option><option value="EXCHANGE">交换</option></select>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`press rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? "bg-ink-950 text-white" : "bg-[var(--bg)] text-[var(--fg-2)] ring-1 ring-[var(--border-soft)] hover:ring-[var(--border)]"}`}>{item}</button>)}
    </div>

    <div className="mt-8 flex items-center justify-between gap-4">
      <p className="text-sm text-[var(--muted)]">找到 <strong className="font-display tnum text-base text-[var(--fg)]">{filtered.length}</strong> 件商品</p>
      <p className="inline-flex items-center gap-1 text-xs text-[var(--meta)]"><ShieldCheck size={14} /> 建议当面验货</p>
    </div>

    {filtered.length ? <div className="stagger mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => {
      const saved = wishlistItems.some((entry) => entry.id === item.id);
      return <article key={item.id} className="card-product reveal group">
        <button onClick={() => setSelected(item)} className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--surface)] text-left">
          <img src={item.image} alt={item.title} className="img-in h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
          <span className="absolute left-3 top-3 rounded-full bg-ink-950 px-3 py-1.5 text-[11px] font-bold text-white">{item.mode === "BUY" ? "出售" : item.mode === "EXCHANGE" ? "交换" : "租用"}</span>
          <span className="absolute bottom-3 left-3 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-bold text-[var(--fg)]">{item.category}</span>
        </button>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <button onClick={() => setSelected(item)} className="min-w-0 text-left"><h3 className="font-bold leading-snug">{item.title}</h3></button>
            <button key={saved ? "on" : "off"} onClick={() => saved ? onRemoveFromWishlist?.(item.id) : onAddToWishlist?.(item)} className={`animate-heart -m-1.5 shrink-0 p-1.5 transition-colors ${saved ? "text-[var(--danger)]" : "text-[var(--meta)] hover:text-[var(--danger)]"}`} aria-label={saved ? "取消收藏" : "加入心愿单"}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="price text-2xl">¥{item.price}</span>
            {item.originalPrice ? <span className="text-xs text-[var(--meta)] line-through">¥{item.originalPrice}</span> : null}
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.description}</p>
          <p className="mt-3 flex items-center gap-1 text-xs text-[var(--meta)]"><MapPin size={13} /> {item.campus}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setSelected(item)} className="press rounded-field bg-ink-950 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--fg-2)]">查看详情</button>
            <button onClick={() => onStartChat?.(item.seller, item)} className="press inline-flex items-center justify-center gap-1 rounded-field bg-[var(--surface)] py-2.5 text-xs font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--border-soft)]"><MessageCircle size={14} /> 沟通</button>
          </div>
        </div>
      </article>;
    })}</div> : <div className="mt-8 apple-card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--meta)]"><Package size={24} /></span>
      <h3 className="font-display text-lg font-bold text-[var(--fg)]">没有找到符合条件的商品</h3>
      <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">换个关键词，或清除校区与方式筛选，看看全部在售书籍与闲置物品。</p>
      <button onClick={() => { setQuery(""); setCategory("全部"); setCampus("全部校区"); setMode("全部"); }} className="press mt-1 rounded-full border border-[var(--border)] bg-transparent px-5 py-2.5 text-xs font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)]">清除全部筛选</button>
    </div>}
  </section>;
}
