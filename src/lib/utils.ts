import { JobStatus, Notification, QuoteStatus } from "./types";

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);

  const date = s.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const startTime = s.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = e.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} · ${startTime} – ${endTime}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getStatusBadgeClasses(status: JobStatus | QuoteStatus): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-status-scheduled-bg text-status-scheduled-text";
    case "COMPLETED":
      return "bg-status-completed-bg text-status-completed-text";
    case "UNSCHEDULED":
      return "bg-surface-muted text-text-secondary";
  }
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => n.readAt === null).length;
}
