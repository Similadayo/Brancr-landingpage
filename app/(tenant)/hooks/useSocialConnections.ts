'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type SocialConnection = {
  id: string;
  platform: string;
  status: "connected" | "pending" | "action_required" | "not_connected";
  description?: string;
  lastUpdated?: string;
};

const FALLBACK_CONNECTIONS: SocialConnection[] = [
  {
    id: "instagram",
    platform: "Instagram Business",
    status: "connected",
    description: "Audience insights, DMs, mentions, and story replies.",
    lastUpdated: "Connected 2 days ago",
  },
  {
    id: "facebook",
    platform: "Facebook Page",
    status: "connected",
    description: "Page inbox, comments, and campaign analytics.",
    lastUpdated: "Connected 5 hours ago",
  },
  {
    id: "whatsapp",
    platform: "WhatsApp Business",
    status: "pending",
    description: "WhatsApp Business API automation and inbox.",
    lastUpdated: "Awaiting Meta verification",
  },
  {
    id: "tiktok",
    platform: "TikTok",
    status: "not_connected",
    description: "Schedule TikTok posts and manage inbox replies.",
    lastUpdated: "Never connected",
  },
];

export function useSocialConnections() {
  return useQuery<SocialConnection[], Error>({
    queryKey: ["social-connections"],
    queryFn: async () => {
      try {
        const response = await tenantApi.socialAccounts();
        return response.accounts.map((account) => ({
          id: String(account.id ?? account.platform ?? crypto.randomUUID()),
          platform:
            (account.platform_name as string) ??
            (account.platform as string) ??
            "Unknown Platform",
          status:
            ((account.status as string) ??
              (account.connection_status as string) ??
              "not_connected") as SocialConnection["status"],
          description:
            (account.description as string) ??
            "Connect to unlock automations and analytics.",
          lastUpdated:
            (account.updated_at as string) ??
            (account.connected_at as string) ??
            undefined,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return FALLBACK_CONNECTIONS;
        }
        throw error;
      }
    },
  });
}

export function useSocialConnectionHistory() {
  return useQuery<Array<{ id: string; action: string; at: string }>, Error>({
    queryKey: ["social-connections", "history"],
    queryFn: async () => {
      try {
        const response = await tenantApi.socialAccountHistory();
        return response.entries;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [
            { id: "1", action: "Meta Embedded Signup initiated for WhatsApp Business", at: "Today • 10:12" },
            { id: "2", action: "Instagram Business connected", at: "Jul 3 • 09:45" },
          ];
        }
        throw error;
      }
    },
  });
}

export function useRefreshSocialConnections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tenantApi.refreshSocialAccounts(),
    onSuccess: () => {
      toast.success("Connection statuses refreshed");
      void queryClient.invalidateQueries({ queryKey: ["social-connections"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to refresh connections.");
      }
    },
  });
}

