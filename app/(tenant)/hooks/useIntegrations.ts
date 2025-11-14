'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type Integration = {
  id: string;
  platform: string;
  connected: boolean;
  username?: string;
  external_id?: string;
  page_id?: string;
  mode?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
};

export function useIntegrations() {
  return useQuery<Integration[], Error>({
    queryKey: ["integrations"],
    queryFn: async () => {
      try {
        const response = await tenantApi.integrations();
        return response.integrations;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Return empty array if endpoint doesn't exist yet
          return [];
        }
        throw error;
      }
    },
  });
}

export function useIntegration(platform: string) {
  return useQuery<Integration | null, Error>({
    queryKey: ["integration", platform],
    queryFn: async () => {
      try {
        const response = await tenantApi.integration(platform);
        return response.integration;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!platform,
  });
}

export function useVerifyIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) => tenantApi.verifyIntegration(platform),
    onSuccess: (data, platform) => {
      toast.success(data.message || `Verified ${platform} connection`);
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["integration", platform] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to verify integration");
      }
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) => tenantApi.disconnectIntegration(platform),
    onSuccess: (_, platform) => {
      toast.success(`Disconnected ${platform}`);
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["integration", platform] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to disconnect integration");
      }
    },
  });
}

