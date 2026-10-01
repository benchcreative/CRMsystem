"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDateTime } from "@/lib/date";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(internal)/notifications/actions";

export type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
  customerId: string | null;
  quoteId: string | null;
};

function notificationHref(notification: NotificationItem): string {
  if (notification.quoteId) return `/quotes/${notification.quoteId}`;
  if (notification.customerId)
    return `/customers/${notification.customerId}/edit`;
  return "/";
}

export function NotificationBell({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: NotificationItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-8 w-8 items-center justify-center text-dash-muted hover:text-dash-ink"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] leading-none text-canvas">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Click-outside catcher */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-80 border border-dash-line bg-dash-surface">
            <div className="flex items-center justify-between border-b border-dash-line px-3 py-2">
              <span className="text-sm text-dash-ink">Notifications</span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead}>
                  <button
                    type="submit"
                    className="text-xs text-dash-muted hover:text-dash-ink"
                  >
                    Mark all as read
                  </button>
                </form>
              )}
            </div>

            <div className="max-h-96 divide-y divide-dash-line overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-dash-muted">
                  No notifications yet.
                </p>
              )}
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notificationHref(notification)}
                  onClick={() => {
                    setIsOpen(false);
                    if (!notification.read) {
                      markNotificationRead(notification.id);
                    }
                  }}
                  className="flex items-start gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${notification.read ? "bg-transparent" : "bg-accent"}`}
                  />
                  <span className="flex-1">
                    <span
                      className={notification.read ? "text-dash-muted" : "text-dash-ink"}
                    >
                      {notification.message}
                    </span>
                    <span className="mt-0.5 block text-xs text-dash-muted">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
