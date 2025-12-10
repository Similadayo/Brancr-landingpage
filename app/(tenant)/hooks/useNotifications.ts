'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, TenantNotification, tenantApi } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import { toast } from "react-hot-toast";

type NotificationStatusFilter = "unread" | "read" | "all";
type NotificationTypeFilter = "message" | "escalation" | "payment" | "system" | "all";

export type NotificationFilters = {
  status: NotificationStatusFilter;
  type: NotificationTypeFilter;
  since?: string;
};

export type NotificationSettings = {
  email_notifications: {
    enabled: boolean;
    order_status_changes: boolean;
    payment_confirmations: boolean;
    receipt_generated: boolean;
  };
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
    secret?: string;
  };
};

export function useNotificationSettings() {
  return useQuery<NotificationSettings | null, Error>({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      try {
        return await tenantApi.getNotificationSettings();
      } catch (error) {
        console.error("Failed to load notification settings:", error);
        return null;
      }
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NotificationSettings>) => {
      return tenantApi.updateNotificationSettings(payload);
    },
    onSuccess: () => {
      toast.success("Notification settings updated");
      void queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update notification settings");
      }
    },
  });
}

export function useTestNotifications() {
  return useMutation({
    mutationFn: async () => {
      return tenantApi.testNotifications();
    },
    onSuccess: (data) => {
      if (data.email_sent && data.webhook_sent) {
        toast.success("Test notifications sent successfully");
      } else if (data.email_sent) {
        toast.success("Test email sent (webhook failed)");
      } else if (data.webhook_sent) {
        toast.success("Test webhook sent (email failed)");
      } else {
        toast.error("Test notifications failed");
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send test notifications");
      }
    },
  });
}

type NotificationsQueryData = {
  notifications: TenantNotification[];
  unread_count?: number;
  next_cursor?: string | null;
  total?: number;
};

type NotificationsContext = {
  previous: Array<[unknown, NotificationsQueryData | undefined]>;
  counts?: { total?: number; unread?: number } | undefined;
};

const FILTER_STORAGE_KEY = "brancr_notifications_filters";

function loadSavedFilters(): NotificationFilters {
  if (typeof window === "undefined") {
    return { status: "all", type: "all" };
  }
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return { status: "all", type: "all" };
    const parsed = JSON.parse(raw);
    return {
      status: parsed.status ?? "all",
      type: parsed.type ?? "all",
      since: parsed.since ?? undefined,
    } satisfies NotificationFilters;
  } catch {
    return { status: "all", type: "all" };
  }
}

export function useNotificationFilters() {
  const [filters, setFilters] = useState<NotificationFilters>(() => loadSavedFilters());

  const updateFilters = (next: NotificationFilters) => {
    setFilters(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage failures are non-fatal
      }
    }
  };

  return { filters, setFilters: updateFilters } as const;
}

function markNotificationsAsRead(
  data: NotificationsQueryData | undefined,
  ids: Array<string | number>
): NotificationsQueryData | undefined {
  if (!data) return data;
  const idSet = new Set(ids.map(String));
  const now = new Date().toISOString();
  const notifications = data.notifications.map((notification) =>
    idSet.has(String(notification.id))
      ? {
          ...notification,
          read_at: notification.read_at ?? now,
          status: notification.status ?? "read",
        }
      : notification
  );

  const unread_count = notifications.filter((notification) => !notification.read_at).length;
  return { ...data, notifications, unread_count };
}

function markAllNotificationsAsRead(data: NotificationsQueryData | undefined): NotificationsQueryData | undefined {
  if (!data) return data;
  const now = new Date().toISOString();
  const notifications = data.notifications.map((notification) => ({
    ...notification,
    read_at: notification.read_at ?? now,
    status: notification.status ?? "read",
  }));
  return { ...data, notifications, unread_count: 0 };
}

export function useNotificationsFeed(params?: {
  status?: NotificationStatusFilter;
  type?: NotificationTypeFilter;
  since?: string;
  limit?: number;
  offset?: number;
  refetchInterval?: number;
}) {
  const queryKey = ["notifications", params];
  return useQuery<NotificationsQueryData>({
    queryKey,
    queryFn: async () => tenantApi.getNotifications(params),
    select: (data) => {
      const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
      const unread_count =
        typeof data?.unread_count === "number"
          ? data.unread_count
          : notifications.filter((notification) => !notification.read_at).length;

      return {
        notifications: notifications.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        unread_count,
        next_cursor: data?.next_cursor ?? null,
        total: data?.total ?? notifications.length,
      };
    },
    staleTime: 15_000,
    refetchInterval: params?.refetchInterval ?? 30_000,
    keepPreviousData: true,
  });
}

export function useNotificationCounts(refetchInterval = 30_000) {
  return useQuery<{ total?: number; unread?: number }>({
    queryKey: ["notification-counts"],
    queryFn: () => tenantApi.getNotificationCounts(),
    staleTime: 15_000,
    refetchInterval,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof tenantApi.markNotificationRead>>,
    unknown,
    string | number,
    NotificationsContext
  >({
    mutationFn: async (notificationId: string | number) => tenantApi.markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notification-counts"] });
      const previous = queryClient.getQueriesData<NotificationsQueryData>({ queryKey: ["notifications"] });
      previous.forEach(([key]) => {
        queryClient.setQueryData<NotificationsQueryData | undefined>(key, (old) =>
          markNotificationsAsRead(old, [notificationId])
        );
      });
      const previousCounts = queryClient.getQueryData<{ total?: number; unread?: number }>(["notification-counts"]);
      if (previousCounts && typeof previousCounts.unread === "number") {
        queryClient.setQueryData<{ total?: number; unread?: number }>(["notification-counts"], {
          ...previousCounts,
          unread: Math.max((previousCounts.unread || 0) - 1, 0),
        });
      }
      return { previous, counts: previousCounts };
    },
    onError: (error, _notificationId, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.counts) {
        queryClient.setQueryData(["notification-counts"], context.counts);
      }
      const message = getUserFriendlyErrorMessage(error) || "Failed to mark notification as read";
      toast.error(message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof tenantApi.markAllNotificationsRead>>,
    unknown,
    void,
    NotificationsContext
  >({
    mutationFn: async () => tenantApi.markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notification-counts"] });
      const previous = queryClient.getQueriesData<NotificationsQueryData>({ queryKey: ["notifications"] });
      previous.forEach(([key]) => {
        queryClient.setQueryData<NotificationsQueryData | undefined>(key, (old) =>
          markAllNotificationsAsRead(old)
        );
      });
      const previousCounts = queryClient.getQueryData<{ total?: number; unread?: number }>(["notification-counts"]);
      if (previousCounts) {
        queryClient.setQueryData(["notification-counts"], { ...previousCounts, unread: 0 });
      }
      return { previous, counts: previousCounts };
    },
    onError: (error, _variables, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.counts) {
        queryClient.setQueryData(["notification-counts"], context.counts);
      }
      const message = getUserFriendlyErrorMessage(error) || "Failed to mark all notifications as read";
      toast.error(message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
}

