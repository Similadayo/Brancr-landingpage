'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import { toast } from "react-hot-toast";

export type Alert = {
  id: string;
  tenant_id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  sent_email: boolean;
  sent_telegram: boolean;
  sent_in_app: boolean;
  email_sent_at?: string;
  telegram_sent_at?: string;
  in_app_created_at?: string;
  created_at: string;
  read_at?: string | null;
  metadata?: string;
};

export type AlertStatusFilter = "unread" | "read" | "all";
export type AlertTypeFilter = "system" | "billing" | "quota" | "security" | "maintenance" | "feature" | "all";
export type AlertSeverityFilter = "info" | "warning" | "critical" | "all";

export type AlertsQueryData = {
  alerts: Alert[];
  unread_count: number;
  total: number;
};

export function useAlerts(params?: {
  status?: AlertStatusFilter;
  type?: AlertTypeFilter;
  severity?: AlertSeverityFilter;
  limit?: number;
  offset?: number;
  refetchInterval?: number;
}) {
  const queryKey = ["alerts", params];
  return useQuery<AlertsQueryData>({
    queryKey,
    queryFn: async () => {
      try {
        // API returns array directly, not wrapped in object
        const alertsArray = await tenantApi.getAlerts({
          unread: params?.status === "unread",
          limit: params?.limit,
          offset: params?.offset,
        });

        const alerts = Array.isArray(alertsArray) ? alertsArray : [];

        // Filter by type and severity on client side if needed
        let filteredAlerts = alerts;
        if (params?.type && params.type !== "all") {
          filteredAlerts = filteredAlerts.filter((a) => a.type === params.type);
        }
        if (params?.severity && params.severity !== "all") {
          filteredAlerts = filteredAlerts.filter((a) => a.severity === params.severity);
        }

        const unread_count = filteredAlerts.filter((alert) => !alert.read_at).length;

        return {
          alerts: filteredAlerts.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          unread_count,
          total: filteredAlerts.length,
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { alerts: [], unread_count: 0, total: 0 };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    refetchInterval: params?.refetchInterval ?? 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAlertCounts(refetchInterval = 30_000) {
  return useQuery<{ total: number; unread: number }, Error>({
    queryKey: ["alert-counts"],
    queryFn: async () => {
      try {
        const response = await tenantApi.getAlertCounts();
        return {
          total: response?.total ?? 0,
          unread: response?.unread ?? 0,
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { total: 0, unread: 0 };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    refetchInterval,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return tenantApi.markAlertRead(alertId);
    },
    onSuccess: (data, alertId) => {
      // Invalidate alerts query
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["alert-counts"] });

      // Optimistically update the alert in cache
      queryClient.setQueryData<AlertsQueryData>(["alerts"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          alerts: oldData.alerts.map((alert) =>
            alert.id === alertId
              ? { ...alert, read_at: new Date().toISOString() }
              : alert
          ),
          unread_count: data.unread_count ?? Math.max(0, oldData.unread_count - 1),
        };
      });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        action: "marking alert as read",
      });
      toast.error(message);
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return tenantApi.markAllAlertsRead();
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["alert-counts"] });

      // Optimistically update all alerts
      queryClient.setQueryData<AlertsQueryData>(["alerts"], (oldData) => {
        if (!oldData) return oldData;
        const now = new Date().toISOString();
        return {
          ...oldData,
          alerts: oldData.alerts.map((alert) => ({
            ...alert,
            read_at: alert.read_at || now,
          })),
          unread_count: data.unread_count ?? 0,
        };
      });

      toast.success("All alerts marked as read");
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        action: "marking all alerts as read",
      });
      toast.error(message);
    },
  });
}

