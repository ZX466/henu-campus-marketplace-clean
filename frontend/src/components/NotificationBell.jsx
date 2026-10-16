import React, { useState, useRef, useEffect } from "react";

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="press relative flex items-center justify-center rounded-full border border-[var(--plate-line)] p-2 text-xs font-semibold text-[var(--on-ink)] transition-colors hover:border-[var(--plate-line-stronger)] hover:bg-[var(--plate-fill-strong)] hover:text-white active:bg-[var(--plate-fill-strong)]"
        title="卖家与订单通知"
        aria-label="卖家与订单通知"
        aria-expanded={isOpen}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={unreadCount > 0 ? "text-[var(--accent)]" : ""}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="tnum absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border border-ink-950 bg-[var(--danger)] px-1 text-[11px] font-black text-white shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="glass-dark absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-panel text-left shadow-float animate-scale-in sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--plate-line)] bg-[var(--plate-fill-faint)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="eyebrow text-white">
                卖家销售与提醒
              </h3>
              {unreadCount > 0 && (
                <span className="tnum rounded-full border border-amber-200/30 bg-amber-200/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                  {unreadCount} 条新消息
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkAllRead && onMarkAllRead()}
                className="text-[11px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] active:text-[var(--accent-active)]"
              >
                全部标为已读
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            className="reveal max-h-80 divide-y divide-[var(--plate-line)] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
          >
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--plate-fill-strong)] text-lg text-[var(--on-ink)]">
                  📭
                </div>
                <p className="text-xs font-semibold text-[var(--on-ink)]">
                  还没有销售通知
                </p>
                <p className="mt-1 text-[11px] text-[var(--meta)]">
                  当有同学买下你的商品时，你会在这里第一时间收到提醒！
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead && onMarkRead(n.id)}
                    className={`flex cursor-pointer gap-3 p-3.5 transition-colors ${
                      isUnread
                        ? "bg-[var(--plate-fill)] hover:bg-[var(--plate-fill)]"
                        : "hover:bg-[var(--plate-fill-faint)]"
                    }`}
                  >
                    <div className="flex-shrink-0 pt-0.5 text-xl">
                      {n.type === "ITEM_SOLD" ? "🎉" : "📦"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h4
                          className={`truncate text-xs font-bold ${
                            isUnread ? "text-white" : "text-[var(--on-ink)]"
                          }`}
                        >
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="pulse-ring h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]"></span>
                        )}
                      </div>

                      <p className="text-[11px] leading-relaxed text-[var(--on-ink)] line-clamp-3">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between border-t border-[var(--plate-line)] pt-1 text-[11px] text-[var(--meta)]">
                        {n.pickup_token && (
                          <span className="rounded bg-[var(--plate-fill-strong)] px-1.5 py-0.5 font-mono font-bold text-[var(--on-ink)]">
                            凭证：{n.pickup_token}
                          </span>
                        )}
                        <span>
                          {n.created_at
                            ? new Date(n.created_at).toLocaleDateString([], {
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
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--plate-line)] bg-black/40 px-4 py-2 text-center text-[11px] text-[var(--meta)]">
            安全的二维码交接验证，保护买家与卖家双方
          </div>
        </div>
      )}
    </div>
  );
}
