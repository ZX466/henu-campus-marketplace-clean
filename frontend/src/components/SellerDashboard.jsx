import React, { useMemo, useState } from "react";

function SellerDashboard({
  products = [],
  currentUser,
  onEditProduct,
  onDeleteProduct,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}) {
  const [editingProduct, setEditingProduct] = useState(null);
  const MODE_LABELS = { BUY: "出售", RENT: "租用", EXCHANGE: "交换" };

  // Only show products belonging to the currently logged-in seller.
  const myProducts = useMemo(() => {
  const userId =
    currentUser?.id ||
    currentUser?._id ||
    currentUser?.userId ||
    currentUser?.sub;

  if (!userId) return [];

  return products.filter(
    (product) => String(product.sellerId) === String(userId)
  );
}, [products, currentUser]);

  const totalProducts = myProducts.length;

  const totalStock = myProducts.reduce(
    (total, product) =>
      total + Math.max(0, Number(product.stock) || 0),
    0
  );

  const outOfStock = myProducts.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  const unreadSoldNotifs = notifications.filter((n) => !n.read);

  return (
    <div className="min-h-screen px-4 pb-8 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="section-head mb-8">
          <div>
            <p className="eyebrow text-[var(--meta)]">河大同享 · 卖家</p>
            <h1 className="mt-3 display-2 text-[var(--fg)]">卖家工作台</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">管理你在河大同享上发布的商品、库存和销售通知。</p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-xs font-bold text-success-800">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-ring" />
                {notifications.length} 条销售提醒
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="reveal mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
            <p className="text-sm font-semibold text-[var(--muted)]">商品总数</p>
            <p className="mt-2 price text-3xl text-[var(--fg)]">{totalProducts}</p>
          </div>

          <div className="rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
            <p className="text-sm font-semibold text-[var(--muted)]">库存总数</p>
            <p className="mt-2 price text-3xl text-[var(--fg)]">{totalStock}</p>
          </div>

          <div className="rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
            <p className="text-sm font-semibold text-[var(--muted)]">已售罄</p>
            <p className="mt-2 price text-3xl text-[var(--danger)]">{outOfStock}</p>
          </div>

          <div className="rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
            <p className="text-sm font-semibold text-[var(--muted)]">待自提</p>
            <p className="mt-2 price flex items-center gap-2 text-3xl text-amber-600">
              {unreadSoldNotifs.length}
              {unreadSoldNotifs.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">需要处理</span>
              )}
            </p>
          </div>
        </div>

        {/* Recent Buyer Orders & Sales Alerts */}
        {notifications.length > 0 && (
          <div className="reveal mb-8 overflow-hidden rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h2 className="display-3 text-[var(--fg)]">最近售出与买家订单</h2>
                {unreadSoldNotifs.length > 0 && (
                  <span className="rounded-full bg-[var(--danger)] px-2 py-0.5 text-[11px] font-bold text-white">
                    {unreadSoldNotifs.length} 条未读
                  </span>
                )}
              </div>

              {unreadSoldNotifs.length > 0 && onMarkAllRead && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--fg)] active:text-[var(--accent-active)]"
                >
                  全部标为已读
                </button>
              )}
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead && onMarkRead(notif.id)}
                  className={`flex cursor-pointer items-start gap-4 p-4 transition-colors ${
                    !notif.read ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-field bg-amber-100 text-lg text-amber-800">
                    🛍️
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[var(--fg)]">{notif.title}</h3>
                      {!notif.read && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">新成交</span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-[var(--fg-2)]">{notif.message}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--meta)]">
                      {notif.pickup_token && (
                        <span className="rounded bg-[var(--surface)] px-2 py-0.5 font-mono font-bold text-[var(--fg-2)]">
                          安全交接凭证：{notif.pickup_token}
                        </span>
                      )}
                      <span>
                        {notif.created_at
                          ? new Date(notif.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "刚刚"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="reveal overflow-hidden rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] shadow-card">

          <div className="border-b border-[var(--border-soft)] px-5 py-4">
            <h2 className="display-3 text-[var(--fg)]">我的商品</h2>
          </div>

          {myProducts.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center before:mb-4 before:flex before:h-14 before:w-14 before:items-center before:justify-center before:rounded-hero before:bg-[var(--surface)] before:text-2xl before:content-['📦']">
              <p className="font-display text-lg font-semibold text-[var(--fg)]">你还没有发布任何商品。</p>
              <p className="mt-2 text-sm text-[var(--muted)]">开始发布后，你的商品会显示在这里。</p>
            </div>
          ) : (
            <div className="grid gap-4 p-5">

              {myProducts.map((product) => {
                const stock = Math.max(0, Number(product.stock) || 0);

                return (
                  <div
                    key={product.id}
                    className="card-product reveal flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    {/* Product */}
                    <div className="flex min-w-0 items-center gap-4">

                      <img
                        src={product.image || "https://via.placeholder.com/100"}
                        alt={product.title}
                        className="h-16 w-16 rounded-field object-cover" loading="lazy" decoding="async" />

                      <div className="min-w-0">

                        <h3 className="truncate font-bold text-[var(--fg)]">{product.title}</h3>

                        <p className="mt-1 price text-sm text-[var(--fg-2)]">
                          ¥{Number(product.price || 0).toLocaleString("zh-CN")}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 font-semibold text-[var(--muted)]">
                            {product.category || "其他"}
                          </span>

                          <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg)] px-2.5 py-1 font-semibold text-[var(--fg-2)]">
                            {MODE_LABELS[product.mode] || "出售"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock + Actions */}
                    <div className="flex flex-wrap items-center gap-3">

                      <span
                        className={`tnum rounded-full px-3 py-1.5 text-xs font-bold ${
                          stock === 0
                            ? "bg-danger-50 text-[var(--danger)]"
                            : stock <= 3
                              ? "bg-amber-50 text-amber-800"
                              : "bg-success-50 text-success-700"
                        }`}
                      >
                        {stock === 0 ? "已售罄" : `库存 ${stock}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="press rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)] active:bg-[var(--border-soft)]"
                      >
                        编辑
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct?.(product.id)}
                        className="press rounded-full bg-danger-50 px-4 py-2 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-danger-100 active:bg-danger-100"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updatedProduct) => {
            onEditProduct?.(updatedProduct);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================================
   EDIT PRODUCT MODAL
   ========================================================================= */

function EditProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    title: product.title || "",
    description: product.description || "",
    price: product.price || "",
    category: product.category || "",
    condition: product.condition || "",
    mode: product.mode || "BUY",
    rentalRate: product.rentalRate || "",
    exchangeWish: product.exchangeWish || "",
    pickupLocation:
      typeof product.pickupLocation === "object"
        ? product.pickupLocation?.name || ""
        : product.pickupLocation || "",
    stock: product.stock ?? 0,
  });

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    if (!form.description.trim()) return;

    if (Number(form.price) <= 0) return;

    if (Number(form.stock) < 0) return;

    /*
     * Keep the original product object intact.
     * This preserves:
     * - id
     * - sellerId
     * - seller
     * - createdAt
     *
     * Only editable fields are replaced.
     */
    onSave({
      ...product,

      title: form.title.trim(),

      description: form.description.trim(),

      price: Number(form.price),

      category: form.category,

      condition: form.condition,

      mode: form.mode,

      rentalRate:
        form.mode === "RENT"
          ? form.rentalRate.trim()
          : "",

      exchangeWish:
        form.mode === "EXCHANGE"
          ? form.exchangeWish.trim()
          : "",

      pickupLocation: form.pickupLocation.trim(),

      stock: Math.max(0, Number(form.stock) || 0),
    });
  };

  const inputClass =
    "w-full rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--meta)] focus:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[rgba(229,71,42,0.35)]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-panel bg-[var(--bg)] shadow-float animate-scale-in">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--bg)] px-6 py-5">

          <div>
            <h2 className="display-3 text-[var(--fg)]">编辑商品</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">更新商品信息和库存。</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-lg text-[var(--fg-2)] transition-colors hover:bg-[var(--border-soft)] active:bg-[var(--border)]"
            aria-label="关闭编辑窗口"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">商品名称</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">商品描述</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={4}
              required
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">价格（元）</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">库存</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">分类</label>
              <input
                type="text"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">成色</label>
              <input
                type="text"
                value={form.condition}
                onChange={(event) => updateField("condition", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">交易方式</label>

            <div className="grid grid-cols-3 gap-2">
              {[["BUY", "出售"], ["RENT", "租用"], ["EXCHANGE", "交换"]].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField("mode", mode)}
                  className={`press rounded-field px-3 py-3 text-xs font-bold transition-colors ${
                    form.mode === mode
                      ? "bg-ink-950 text-white"
                      : "bg-[var(--surface)] text-[var(--fg-2)] hover:bg-[var(--border-soft)] active:bg-[var(--border)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.mode === "RENT" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">租金（元/天）</label>
              <input
                type="text"
                value={form.rentalRate}
                onChange={(event) => updateField("rentalRate", event.target.value)}
                placeholder="例如：每天 ¥5"
                className={inputClass}
              />
            </div>
          )}

          {form.mode === "EXCHANGE" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">你想交换什么？</label>
              <input
                type="text"
                value={form.exchangeWish}
                onChange={(event) => updateField("exchangeWish", event.target.value)}
                placeholder="例如：工程类教材"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--fg-2)]">自提地点</label>
            <input
              type="text"
              value={form.pickupLocation}
              onChange={(event) => updateField("pickupLocation", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border-soft)] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="press rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)] active:bg-[var(--border-soft)]"
            >
              取消
            </button>

            <button
              type="submit"
              className="press rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellerDashboard;
