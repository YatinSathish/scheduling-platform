"use client";

import { useCallback, useEffect, useState } from "react";
import { Notification, RecipientType } from "@/lib/types";
import { getUnreadCount } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

export function useNotifications(
  recipientType: RecipientType,
  recipientId: string | null
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!recipientId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?recipientType=${recipientType}&recipientId=${recipientId}`
      );
      if (res.ok) {
        const data: Notification[] = await res.json();
        setNotifications(data);
      }
    } catch {
      // silent — polling will retry on next interval
    } finally {
      setLoading(false);
    }
  }, [recipientType, recipientId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => n.readAt === null);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    await Promise.all(
      unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }))
    );
  };

  return {
    notifications,
    unreadCount: getUnreadCount(notifications),
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
