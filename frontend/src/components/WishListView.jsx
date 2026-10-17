import React, { useState } from 'react';

function WishlistView({
  wishlistItems = [],
  onBack,
  onOpenProduct,
  onRemove,
  onToggleNeeded
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredItems = wishlistItems.filter(item => {
    if (activeTab === 'NEEDED') {
      return item.neededByMe;
    }

    return true;
  });

  return (
    <section className="mx-auto max-w-7xl px-6 pt-32 pb-20 sm:px-12">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
      >
        ← 返回集市
      </button>

      <div className="flex flex-col justify-between gap-5 border-b border-[var(--border-soft)] pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[var(--meta)]">我的收藏</p>
          <h1 className="mt-3 display-2 text-[var(--fg)]">我的心愿单</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">收藏校园里想买或需要的物品，方便随时查看。</p>
        </div>

        <div className="shrink-0 text-sm text-[var(--muted)]">
          <strong className="font-display text-lg text-[var(--fg)] tnum">{wishlistItems.length}</strong>{' '}
          件已收藏
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`press rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'ALL'
              ? 'bg-ink-950 text-white'
              : 'bg-[var(--surface)] text-[var(--fg-2)] hover:bg-[var(--border-soft)]'
          }`}
        >
          全部收藏
        </button>

        <button
          onClick={() => setActiveTab('NEEDED')}
          className={`press rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'NEEDED'
              ? 'bg-ink-950 text-white'
              : 'bg-[var(--surface)] text-[var(--fg-2)] hover:bg-[var(--border-soft)]'
          }`}
        >
          我正在求购
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-10 apple-card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-4xl leading-none text-[var(--meta)]">♡</span>

          <h2 className="mt-5 font-display text-xl font-bold text-[var(--fg)]">
            {activeTab === 'NEEDED'
              ? '还没有标记为求购的商品'
              : '你的心愿单还是空的'}
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
            {activeTab === 'NEEDED'
              ? '把收藏的商品标记为“我正在求购”后，就会显示在这里。'
              : '去集市逛逛，把想买的商品收藏起来吧。'}
          </p>

          <button
            onClick={onBack}
            className="press mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
          >
            去逛集市
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(product => (
            <article
              key={product.id}
              className="card-product reveal group"
            >
              <button
                onClick={() => onOpenProduct(product)}
                className="block aspect-[4/3] w-full overflow-hidden bg-[var(--surface)]"
              >
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
              </button>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onOpenProduct(product)}
                    className="min-w-0 text-left"
                  >
                    <h2 className="font-display text-xl font-bold leading-snug text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
                      {product.title}
                    </h2>
                  </button>

                  <button
                    onClick={() => onRemove(product.id)}
                    className="press shrink-0 text-xl text-[var(--danger)] transition-transform hover:scale-110"
                    aria-label="从心愿单移除"
                  >
                    ♥
                  </button>
                </div>

                <p className="price mt-2 text-2xl text-[var(--fg)]">
                  ₹{Number(product.price).toFixed(2)}
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {product.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--fg-2)]">
                    {product.mode}
                  </span>

                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--fg-2)]">
                    {product.category}
                  </span>

                  {product.neededByMe && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      我正在求购
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onToggleNeeded(product.id)}
                  className={`press mt-5 w-full rounded-full py-3 text-sm font-bold transition-colors ${
                    product.neededByMe
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-ink-950 text-white hover:bg-[var(--fg-2)]'
                  }`}
                >
                  {product.neededByMe
                    ? '取消求购标记'
                    : '标记为我正在求购'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default WishlistView;
