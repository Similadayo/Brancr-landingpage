'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

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

