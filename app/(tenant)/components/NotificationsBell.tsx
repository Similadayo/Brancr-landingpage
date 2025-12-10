'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TenantNotification } from "@/lib/api";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCounts,
  useNotificationFilters,
  useNotificationsFeed,
} from "../hooks/useNotifications";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import { AlertIcon, BellIcon, InboxIcon } from "./icons";
import { toast } from "react-hot-toast";

const KIND_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: JSX.Element }
> = {
  message: {
    label: "Inbox",
    badgeClass: "bg-primary/10 text-primary",
    icon: <InboxIcon className="h-4 w-4" />,
  },
  escalation: {
    label: "Escalation",
    badgeClass: "bg-orange-100 text-orange-700",
    icon: <AlertIcon className="h-4 w-4" />,
  },
  payment: {
    label: "Payment",
    badgeClass: "bg-emerald-100 text-emerald-700",
    icon: <BellIcon className="h-4 w-4" />,
  },
  system: {
    label: "System",
    badgeClass: "bg-gray-100 text-gray-700",
    icon: <BellIcon className="h-4 w-4" />,
  },
};

function getKind(notification: TenantNotification): keyof typeof KIND_CONFIG {
  const raw = (
    notification.type ||
    notification.category ||
    notification.resource_type ||
    ""
  ).toLowerCase();
  if (raw.includes("escalation")) return "escalation";
  if (raw.includes("payment")) return "payment";
  if (raw.includes("message") || raw.includes("conversation") || notification.conversation_id) return "message";
  return "system";
}

function resolveConversationId(notification: TenantNotification): string | null {
  if (notification.conversation_id) return String(notification.conversation_id);
  const meta = notification.metadata;
  const metaConversation =
    typeof meta?.conversation_id === "string" || typeof meta?.conversation_id === "number"
      ? meta.conversation_id
      : typeof (meta as any)?.conversationId === "string" || typeof (meta as any)?.conversationId === "number"
      ? (meta as any).conversationId
      : undefined;
  return metaConversation ? String(metaConversation) : null;
}

function resolveDestination(notification: TenantNotification): string | null {
  const conversationId = resolveConversationId(notification);
  if (conversationId) return `/app/inbox?conversationId=${encodeURIComponent(conversationId)}`;
  if (notification.escalation_id || notification.resource_type === "escalation") {
    return "/app/escalations";
  }
  return null;
}

function formatTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (Number.isNaN(diffMins)) return "";
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function renderSummary(notification: TenantNotification) {
  if (notification.title) return notification.title;
  if (notification.message) return notification.message;
  return "New activity";
}

function getUserFriendlyMessage(error: unknown) {
  const msg = getUserFriendlyErrorMessage(error);
  return msg || "Please try again.";
}

export function NotificationsBell() {
  const router = useRouter();
  const { filters, setFilters } = useNotificationFilters();
  const { data: countsData } = useNotificationCounts(15_000);
  const { data, isLoading, isFetching, error, refetch } = useNotificationsFeed({
    status: filters.status,
    type: filters.type === "all" ? undefined : filters.type,
    since: filters.since,
    limit: 50,
    refetchInterval: 15_000,
  });
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = countsData?.unread ?? (data && "unread_count" in data ? data.unread_count : 0) ?? 0;
  const notifications = data?.notifications ?? [];

  const isEmpty = !isLoading && notifications.length === 0;

  const visibleNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const handleFilterChange = (partial: Partial<typeof filters>) => {
    setFilters({ ...filters, ...partial });
  };

  const handleItemClick = (notification: TenantNotification) => {
    if (notification?.id !== undefined) {
      markReadMutation.mutate(notification.id);
    }
    const destination = resolveDestination(notification);
    if (destination) {
      router.push(destination);
    } else {
      toast.error("We couldn't find the linked item for this notification.");
    }
    setOpen(false);
  };

  const handleKeyActivate = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, notification: TenantNotification) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleItemClick(notification);
      }
    },
    [handleItemClick]
  );

  const handleMarkAll = () => {
    if (unreadCount === 0 || markAllMutation.isLoading) return;
    markAllMutation.mutate();
  };

  const SINCE_OPTIONS: Array<{ label: string; value?: string }> = [
    { label: "Any time", value: undefined },
    { label: "Last 24h", value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { label: "Last 7 days", value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-accent hover:text-accent"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        {isFetching ? (
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[420px] max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Stay on top of conversations and escalations</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <button
                  type="button"
                  onClick={() => handleFilterChange({ status: filters.status === "unread" ? "all" : "unread" })}
                  className={`rounded-full px-2 py-1 font-semibold transition ${
                    filters.status === "unread" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {filters.status === "unread" ? "Unread" : "All"}
                </button>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={filters.type}
                  onChange={(e) => handleFilterChange({ type: e.target.value as any })}
                >
                  <option value="all">All types</option>
                  <option value="message">Messages</option>
                  <option value="escalation">Escalations</option>
                  <option value="payment">Payments</option>
                  <option value="system">System</option>
                </select>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={filters.since ?? ""}
                  onChange={(e) => handleFilterChange({ since: e.target.value || undefined })}
                >
                  {SINCE_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value ?? ""}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={unreadCount === 0 || markAllMutation.isLoading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:border-primary hover:text-primary"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 pb-2">
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-semibold">
                {unreadCount ?? 0} unread
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-semibold">
                {countsData?.total ?? notifications.length} total
              </span>
              {isFetching ? <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden /> : null}
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto border-t border-gray-100" ref={listRef}>
            {isLoading ? (
              <div className="space-y-3 px-4 py-4">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-1/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="px-6 py-10 text-center text-sm text-red-700">
                <p className="font-semibold">We couldn&apos;t load notifications.</p>
                <p className="text-xs text-red-600">{getUserFriendlyMessage(error)}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 inline-flex rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {isEmpty && !error ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <BellIcon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">You&apos;re all caught up</p>
                <p className="text-xs text-gray-500">We&apos;ll let you know when something new happens.</p>
              </div>
            ) : null}

            {!isLoading && !isEmpty ? (
              <ul className="divide-y divide-gray-100" role="listbox">
                {visibleNotifications.map((notification) => {
                  const kind = getKind(notification);
                  const config = KIND_CONFIG[kind] ?? KIND_CONFIG.system;
                  const isUnread = !notification.read_at;
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(notification)}
                        onKeyDown={(event) => handleKeyActivate(event, notification)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        tabIndex={0}
                        role="option"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            isUnread ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {renderSummary(notification)}
                            </p>
                            <span className="whitespace-nowrap text-[11px] font-semibold text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}>
                              {config.icon}
                              <span>{config.label}</span>
                            </span>
                            {isUnread ? (
                              <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden />
                            ) : null}
                          </div>
                          {notification.message ? (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600">{notification.message}</p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
              <span>
                {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/app/inbox");
              }}
              className="font-semibold text-primary hover:text-primary/80"
            >
              Open inbox
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
