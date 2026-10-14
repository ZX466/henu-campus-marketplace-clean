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
    <section className="max-w-5xl mx-auto px-6 sm:px-12 pt-32 pb-24 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
          河大同享 · 结算
        </p>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-neutral-950 mt-2">
          学生购物袋
        </h1>

        <p className="text-sm text-neutral-500 mt-2">
          确认校内自提订单前，先检查一下商品信息。
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="p-12 text-center bg-neutral-50 rounded-3xl border border-neutral-200 space-y-4">
          <div className="text-4xl">🛍️</div>

          <h2 className="font-display text-xl font-bold text-neutral-900">
            购物车是空的
          </h2>

          <p className="text-neutral-500 text-sm">
            去集市挑一件心仪的商品吧。
          </p>

          <button
            onClick={onContinue}
            className="px-6 py-3 bg-neutral-950 text-white font-bold rounded-xl text-xs hover:bg-neutral-800"
          >
            去逛集市
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          <div className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200">
                <h2 className="font-display font-bold text-lg text-neutral-900">
                  购物车商品
                </h2>

                <p className="text-xs text-neutral-500 mt-1">
                  购物袋中共有 {cart.length} 件商品
                </p>
              </div>

              <div className="flex flex-col gap-8 p-4">
                {cart.map((item) => (
  <div
    key={item.id}
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
  >
    <img
      src={item.image}
      alt={item.title}
      className="h-64 w-full object-cover"
    />

    <div className="space-y-3 bg-gradient-to-br from-white to-slate-50 p-5">
      <div>
        <h4 className="text-lg font-bold text-slate-900">
          {item.title}
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-3">
  <span className="text-xl font-extrabold text-indigo-600">
    ¥{Number(item.price || 0).toFixed(2)}
  </span>

  <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 p-1">
    <button
      type="button"
      onClick={() => onDecrease(item.id)}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-indigo-700 transition hover:bg-indigo-100"
      aria-label={`减少「${item.title}」的数量`}
    >
      −
    </button>

    <span className="min-w-6 text-center text-sm font-bold text-indigo-700">
      {item.qty}
    </span>

    <button
      type="button"
      onClick={() => onIncrease(item.id)}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white transition hover:bg-indigo-700"
      aria-label={`增加「${item.title}」的数量`}
    >
      +
    </button>
  </div>

  <span className="text-xs text-slate-500">
    合计 ¥{(Number(item.price || 0) * item.qty).toFixed(2)}
  </span>
</div>
      </div>

      <div className="space-y-2 border-t border-slate-200 pt-3">
        <div className="flex items-start gap-3">
          <span className="text-lg">👤</span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              卖家
            </p>

            <p className="text-sm font-medium text-slate-700">
              {typeof item.seller === "object"
                ? item.seller?.name || "校内卖家"
                : item.seller || "校内卖家"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-lg">📍</span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              自提地点
            </p>

            <p className="text-sm font-medium text-slate-700">
              {typeof item.pickupLocation === "object"
                ? item.pickupLocation?.name || "校内安全交接点"
                : item.pickupLocation || "校内安全交接点"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        从购物车移除
      </button>
    </div>
  </div>
))}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-3">
                <div className="text-xl">📍</div>

                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    校园自提
                  </h3>

                  <p className="text-xs text-neutral-500 mt-1">
                    订单确认后会生成一个自提凭证。
                    请与卖家在校内选定的地点当面交接。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-6 space-y-6 lg:sticky lg:top-28">
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900">
                订单摘要
              </h2>

              <p className="text-xs text-neutral-500 mt-1">
                安全的校内当面交易
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">商品小计</span>
                <span className="font-semibold">
                  ¥{total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">校内自提费</span>
                <span className="font-semibold text-emerald-600">
                  免费
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex justify-between gap-4 text-lg font-display font-bold">
                <span>总计</span>
                <span>¥{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3.5 bg-neutral-950 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 shadow-md"
            >
              确认订单并生成二维码
            </button>

            <button
              onClick={onContinue}
              className="w-full py-3 bg-neutral-100 text-neutral-800 font-bold rounded-xl text-xs hover:bg-neutral-200"
            >
              返回集市
            </button>

            <p className="text-[11px] leading-relaxed text-neutral-400 text-center">
              此演示版本会把订单保存在浏览器本地。
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartFullView;
