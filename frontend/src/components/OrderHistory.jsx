import React, { useMemo, useState } from "react";

const STATUS_STEPS = [
  "已下单",
  "待自提",
  "可自提",
  "已完成",
];

const STATUS_STYLES = {
  "已下单": "bg-[var(--surface)] text-[var(--fg-2)]",
  "待自提": "bg-amber-100 text-amber-800",
  "可自提": "bg-success-100 text-success-700",
  "已完成": "bg-success-100 text-success-800",
  "已取消": "bg-danger-100 text-[var(--danger)]",
};

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "pending" || value === "pending pickup") {
    return "待自提";
  }

  if (value === "ready" || value === "ready for pickup") {
    return "可自提";
  }

  if (value === "completed" || value === "complete") {
    return "已完成";
  }

  if (value === "cancelled" || value === "canceled") {
    return "已取消";
  }

  if (value === "order placed") {
    return "已下单";
  }

  return "待自提";
}

function getStatusIndex(status) {
  const index = STATUS_STEPS.indexOf(status);
  return index === -1 ? 1 : index;
}

function OrderHistory({ orders = [], onBack, onCancelOrder }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const normalizedStatus = normalizeStatus(order.status);

      const matchesSearch =
        !normalizedSearch ||
        String(order.id || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.items?.some((item) =>
          String(item.title || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "All" ||
        normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleCopyToken = async (token) => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(String(token));
      setCopiedToken(token);

      window.setTimeout(() => {
        setCopiedToken(null);
      }, 1500);
    } catch {
      setCopiedToken(null);
    }
  };

  const handleCancelOrder = (orderId) => {
    const confirmed = window.confirm(
      "确定要取消这笔订单吗？"
    );

    if (!confirmed) return;

    if (onCancelOrder) {
      onCancelOrder(orderId);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:px-12">
      <div className="border-b border-[var(--border-soft)] pb-8">
        <p className="eyebrow text-[var(--meta)]">河大同享 · 我的账户</p>
        <h1 className="mt-3 display-2 text-[var(--fg)]">订单记录</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">查看订单进度、已购商品和自提信息。</p>
      </div>

      {orders.length > 0 && (
        <div className="mt-8 grid gap-4 rounded-panel border border-[var(--border-soft)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_220px] sm:p-5">
          <div>
            <label
              htmlFor="order-search"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
            >
              搜索订单
            </label>

            <input
              id="order-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索订单号或商品名称…"
              className="w-full rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="order-status"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
            >
              按状态筛选
            </label>

            <select
              id="order-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full cursor-pointer rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-medium text-[var(--fg)] outline-none transition-colors focus:border-[var(--accent)]"
            >
              <option value="All">全部订单</option>
              <option value="已下单">已下单</option>
              <option value="待自提">待自提</option>
              <option value="可自提">可自提</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-10 apple-card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-3xl">📦</span>

          <h2 className="mt-5 font-display text-xl font-bold text-[var(--fg)]">还没有订单</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">确认后的订单会显示在这里。</p>

          <button
            onClick={onBack}
            className="press mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
          >
            去逛集市
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="mt-10 apple-card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-3xl">🔎</span>

          <h2 className="mt-5 font-display text-xl font-bold text-[var(--fg)]">没有匹配的订单</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">换个关键词，或调整状态筛选条件。</p>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
            }}
            className="press mt-5 rounded-full border border-[var(--border)] bg-transparent px-5 py-3 text-xs font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)]"
          >
            清除筛选
          </button>
        </div>
      ) : (
        <div className="stagger mt-8 space-y-6">
          {filteredOrders.map((order) => {
            const status = normalizeStatus(order.status);
            const isExpanded = expandedOrder === order.id;
            const isCancelled = status === "已取消";
            const currentStep = getStatusIndex(status);

            return (
              <article
                key={order.id}
                className="card-product reveal overflow-hidden"
              >
                <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--meta)]">订单编号</p>
                    <h2 className="mt-1 font-mono text-lg font-bold text-[var(--fg)]">{order.id || "未知订单"}</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "时间不可用"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[status] || "bg-[var(--surface)] text-[var(--fg-2)]"}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="space-y-6 p-5">
                  {!isCancelled && (
                    <div>
                      <h3 className="mb-4 text-sm font-bold text-[var(--fg)]">订单进度</h3>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {STATUS_STEPS.map((step, index) => {
                          const isCompleted = index <= currentStep;

                          return (
                            <div key={step} className="relative">
                              <div
                                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-colors ${
                                  isCompleted
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-[var(--surface)] text-[var(--meta)]"
                                }`}
                              >
                                {isCompleted ? "✓" : index + 1}
                              </div>

                              <p
                                className={`text-xs font-bold ${
                                  isCompleted
                                    ? "text-[var(--fg)]"
                                    : "text-[var(--meta)]"
                                }`}
                              >
                                {step}
                              </p>

                              {index < STATUS_STEPS.length - 1 && (
                                <div
                                  className={`absolute left-9 top-4 hidden h-0.5 w-[calc(100%-1rem)] sm:block ${
                                    index < currentStep
                                      ? "bg-[var(--accent)]"
                                      : "bg-[var(--border-soft)]"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-card border border-[var(--border-soft)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--meta)]">订单金额</p>
                      <p className="mt-1 font-display text-xl font-bold text-[var(--fg)] tnum">
                        ¥{Number(order.total || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-card border border-[var(--border-soft)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--meta)]">自提地点</p>
                      <p className="mt-1 text-sm font-bold text-[var(--fg)]">
                        {order.pickupLocation || "校内安全交接点"}
                      </p>
                    </div>

                    <div className="rounded-card border border-[var(--border-soft)] bg-[var(--surface)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">自提凭证</p>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="font-mono text-xl font-black tracking-widest text-[var(--fg)] tnum">
                          {order.pickupToken || "------"}
                        </p>

                        {order.pickupToken && (
                          <button
                            onClick={() => handleCopyToken(order.pickupToken)}
                            className="press rounded-lg bg-[var(--bg)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-[var(--border-soft)]"
                          >
                            {copiedToken === order.pickupToken ? "已复制" : "复制"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="press rounded-full border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)]"
                    >
                      {isExpanded ? "收起商品" : "查看商品"}
                    </button>

                    {status === "待自提" && !isCancelled && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="press rounded-full border border-danger-200 px-4 py-2.5 text-xs font-bold text-[var(--danger)] transition-colors hover:bg-danger-50"
                      >
                        取消订单
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[var(--border-soft)] pt-5">
                      <h3 className="mb-3 text-sm font-bold text-[var(--fg)]">已购商品</h3>

                      <div className="space-y-3">
                        {order.items?.length ? (
                          order.items.map((item, index) => (
                            <div
                              key={`${item.id || item.title}-${index}`}
                              className="flex items-center gap-3 rounded-card bg-[var(--surface)] p-3"
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title || "已购商品"}
                                  className="h-16 w-16 rounded-field object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-field bg-[var(--border-soft)] text-2xl">
                                  📦
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-[var(--fg)]">
                                  {item.title || "未命名商品"}
                                </h4>

                                <p className="mt-1 text-xs text-[var(--muted)] tnum">数量：{item.qty || 1}</p>
                              </div>

                              <p className="shrink-0 font-display text-sm font-bold text-[var(--fg)] tnum">
                                ¥
                                {(
                                  Number(item.price || 0) *
                                  Number(item.qty || 1)
                                ).toFixed(2)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--muted)]">暂无商品详情。</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default OrderHistory;
