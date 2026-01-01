'use client';

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type ApiKey = {
  id: string;
  name: string;
  scope: string;
  createdAt: string;
  token?: string;
};

export function useTeamMembers() {
  return useQuery<TeamMember[], Error>({
    queryKey: ["team-members"],
    queryFn: async () => {
      try {
        const response = await tenantApi.teamMembers();
        return response.members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [
            { id: "t1", name: "Ada Lovelace", email: "ada@brancr.com", role: "Owner" },
            { id: "t2", name: "Seyi Ade", email: "seyi@brancr.com", role: "Agent" },
            { id: "t3", name: "Tunde Obi", email: "tunde@brancr.com", role: "Viewer" },
          ];
        }
        throw error;
      }
    },
  });
}

export function useApiKeys() {
  return useQuery<ApiKey[], Error>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      try {
        const response = await tenantApi.apiKeys();
        return response.keys.map((key) => ({
          id: key.id,
          name: key.name,
          scope: key.scope,
          createdAt: key.created_at,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [
            { id: "pk-1234", name: "Production Bot", scope: "Full access", createdAt: "Apr 12, 2025" },
            { id: "pk-5678", name: "Staging Sandbox", scope: "Read only", createdAt: "Jun 01, 2025" },
          ];
        }
        throw error;
      }
    },
  });
}

export function useBilling() {
  return useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      try {
        const response = await tenantApi.billing();
        return response;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Fallback mock data matching new structure
          return {
            plan: {
              type: "trial",
              name: "Trial",
              price: 0,
              currency: "USD",
              billing_period: "monthly",
              features: [
                "AI-powered customer replies",
                "WhatsApp, Instagram, Facebook integrations",
                "Basic analytics"
              ]
            },
            trial: {
              is_trial: true,
              days_remaining: 30,
              ends_at: "2026-01-31T00:00:00Z"
            },
            subscription: {
              status: "trial",
              expires_at: null
            }
          };
        }
        throw error;
      }
    },
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      try {
        return await tenantApi.usage();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return {
            conversations: { used: 2140, limit: 5000 },
            active_seats: { used: 4, limit: 10 },
          };
        }
        throw error;
      }
    },
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; scope: string }) => tenantApi.createApiKey(payload),
    onSuccess: (data) => {
      toast.success("API key generated");
      if (data.token) {
        toast.success(`Copy this token now: ${data.token}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to create API key.");
      }
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => tenantApi.revokeApiKey(keyId),
    onSuccess: () => {
      toast.success("API key revoked");
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to revoke API key.");
      }
    },
  });
}


export function useUpdateWebhook() {
  return useMutation({
    mutationFn: (payload: { url: string }) => tenantApi.updateWebhook(payload),
    onSuccess: () => {
      toast.success("Webhook updated");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to update webhook.");
      }
    },
  });
}

export function useEscalationSettings() {
  return useQuery({
    queryKey: ["escalation-settings"],
    queryFn: async () => {
      try {
        const response = await tenantApi.escalationSettings();
        return response;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Fallback mock data
          return {
            enabled: true,
            escalation_behavior: "configurable" as const,
            is_configurable: true,
          };
        }
        throw error;
      }
    },
  });
}

export function useUpdateEscalationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { enabled: boolean }) => tenantApi.updateEscalationSettings(payload),
    onSuccess: (data) => {
      toast.success(data.enabled ? "Escalation enabled" : "Escalation disabled");
      void queryClient.invalidateQueries({ queryKey: ["escalation-settings"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update settings");
      }
    },
  });
}

