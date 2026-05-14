"use client";

import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import { RecipientType } from "@/lib/types";

interface Props {
  recipientType: RecipientType;
  recipientId: string | null;
}

export default function NotificationBell({
  recipientType,
  recipientId,
}: Props) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } =
    useNotifications(recipientType, recipientId);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev) refresh();
      return !prev;
    });
  };

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-error text-white text-[10px] font-semibold leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <li className="px-5 py-8 text-sm text-text-secondary text-center">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id);
                  }}
                  className={`
                    px-5 py-4 flex flex-col gap-1 cursor-pointer
                    hover:bg-surface-muted transition-colors
                    ${!n.readAt ? "border-l-2 border-brand-primary" : "border-l-2 border-transparent"}
                  `}
                >
                  <span
                    className={`text-sm leading-snug ${!n.readAt ? "font-medium text-text-primary" : "text-text-secondary"}`}
                  >
                    {n.message}
                  </span>
                  <span className="text-xs text-text-disabled">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
