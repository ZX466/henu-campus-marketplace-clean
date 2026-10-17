import React from "react";

function CartFullView({
  cart,
  onRemove,
  onContinue,
  onCheckout,
  onIncrease,
  onDecrease
}) {
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0,
  );

  return (
    <section className="mx-auto max-w-5xl px-6 pt-32 pb-24 sm:px-12">
      <div className="border-b border-[var(--border-soft)] pb-8">
        <p className="eyebrow text-[var(--meta)]">河大同享 · 结算</p>
        <h1 className="mt-3 display-2 text-[var(--fg)]">学生购物袋</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">确认校内自提订单前，先检查一下商品信息。</p>
      </div>

      {cart.length === 0 ? (
        <div className="mt-10 apple-card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-3xl">🛍️</span>
          <h2 className="mt-5 font-display text-xl font-bold text-[var(--fg)]">购物车是空的</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">去集市挑一件心仪的商品吧。</p>
          <button
            onClick={onContinue}
            className="press mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
          >
            去逛集市
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="apple-card overflow-hidden">
              <div className="border-b border-[var(--border-soft)] px-6 py-5">
                <h2 className="font-display text-lg font-bold text-[var(--fg)]">购物车商品</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">购物袋中共有 {cart.length} 件商品</p>
              </div>
              <div className="stagger divide-y divide-[var(--border-soft)]">
                {cart.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.title} className="img-in h-20 w-20 shrink-0 rounded-card object-cover" loading="lazy" decoding="async" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[var(--fg)]">{item.title}</h4>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <span className="price text-xl text-[var(--fg)]">¥{Number(item.price || 0).toFixed(2)}</span>
                          <div className="flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] p-1">
                            <button type="button" onClick={() => onDecrease(item.id)} className="press flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg)] text-lg font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--border-soft)]" aria-label={`减少「${item.title}」的数量`}>−</button>
                            <span className="min-w-6 text-center text-sm font-bold text-[var(--fg)] tnum">{item.qty}</span>
                            <button type="button" onClick={() => onIncrease(item.id)} className="press flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]" aria-label={`增加「${item.title}」的数量`}>+</button>
                          </div>
                          <span className="text-xs text-[var(--muted)] tnum">合计 ¥{(Number(item.price || 0) * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">👤</span>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-[var(--meta)]">卖家</p>
                            <p className="font-medium text-[var(--fg-2)]">
                              {typeof item.seller === "object"
                                ? item.seller?.name || "校内卖家"
                                : item.seller || "校内卖家"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">📍</span>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-[var(--meta)]">自提地点</p>
                            <p className="font-medium text-[var(--fg-2)]">
                              {typeof item.pickupLocation === "object"
                                ? item.pickupLocation?.name || "校内安全交接点"
                                : item.pickupLocation || "校内安全交接点"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemove(item.id)}
                        className="press shrink-0 self-start rounded-full border border-[var(--danger)] bg-danger-50 px-4 py-2 text-xs font-semibold text-[var(--danger)] transition-colors hover:bg-danger-100 sm:self-auto"
                      >
                        从购物车移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-panel border border-[var(--border-soft)] bg-[var(--surface)] p-5">
              <div className="flex items-start gap-3">
                <div className="text-xl">📍</div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--fg)]">校园自提</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    订单确认后会生成一个自提凭证。请与卖家在校内选定的地点当面交接。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="h-fit space-y-6 apple-card p-6 lg:sticky lg:top-28">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--fg)]">订单摘要</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">安全的校内当面交易</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--muted)]">商品小计</span>
                <span className="font-semibold tnum">¥{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--muted)]">校内自提费</span>
                <span className="font-semibold text-success-600">免费</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[var(--border-soft)] pt-4 font-display text-lg font-bold">
                <span>总计</span>
                <span className="tnum">¥{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="press w-full rounded-full bg-[var(--accent)] py-3.5 text-xs font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
            >
              确认订单并生成二维码
            </button>

            <button
              onClick={onContinue}
              className="press w-full rounded-full bg-[var(--surface)] py-3 text-xs font-bold text-[var(--fg)] transition-colors hover:bg-[var(--border-soft)]"
            >
              返回集市
            </button>

            <p className="text-center text-[11px] leading-relaxed text-[var(--meta)]">
              此演示版本会把订单保存在浏览器本地。
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartFullView;
