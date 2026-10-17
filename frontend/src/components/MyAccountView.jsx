import React, { useState } from "react";

import OrderHistory from "./OrderHistory";
import SellerDashboard from "./SellerDashboard";
import WishlistView from "./WishListView";

/**
 * 「我的」—— 把收藏、订单、我发布的商品收进一个页面（周期一：统一入口）。
 *
 * 三个子视图本来就是自包含列表，各自带 onBack，所以这里只做 tab 切换，
 * 不复制任何列表逻辑。未登录用户到不了这个页面（App.jsx 的 navigateTo 会拦截）。
 */
function MyAccountView({
  orders = [],
  wishlistItems = [],
  products = [],
  currentUser,
  onBack,
  onOpenProduct,
  onRemoveFromWishlist,
  onToggleNeeded,
  onCancelOrder,
  onEditProduct,
  onDeleteProduct,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}) {
  const [activeTab, setActiveTab] = useState("orders");

  const TABS = [
    { id: "orders", label: "订单记录", count: orders.length },
    { id: "wishlist", label: "我的收藏", count: wishlistItems.length },
    { id: "published", label: "我发布的", count: products.length },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            我的
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            订单、收藏与发布内容汇总
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          返回
        </button>
      </div>

      <div
        role="tablist"
        aria-label="我的分组"
        className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "orders" && (
        <OrderHistory
          orders={orders}
          onBack={onBack}
          onCancelOrder={onCancelOrder}
        />
      )}

      {activeTab === "wishlist" && (
        <WishlistView
          wishlistItems={wishlistItems}
          onBack={onBack}
          onOpenProduct={onOpenProduct}
          onRemove={onRemoveFromWishlist}
          onToggleNeeded={onToggleNeeded}
        />
      )}

      {activeTab === "published" && (
        <SellerDashboard
          products={products}
          currentUser={currentUser}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          notifications={notifications}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
        />
      )}
    </div>
  );
}

export default MyAccountView;
