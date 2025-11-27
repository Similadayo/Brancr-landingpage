'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type Escalation = {
  id: number;
  interactionId: number;
  customerId: number;
  customerName: string;
  customerUsername?: string;
  platform: string;
  message: string;
  intent: string;
  tone: string;
  confidence: number;
  suggestedReply: string;
  createdAt: string;
  conversationId: number;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
};

export type EscalationDetail = {
  escalation: Escalation;
  customer: {
    id: number;
    name: string;
    username?: string;
    platform: string;
  };
  conversationHistory: Array<{
    id: number;
    author: "tenant" | "customer";
    body: string;
    sentAt: string;
  }>;
  interactions: Array<{
    id: number;
    type: string;
    createdAt: string;
  }>;
};

export type EscalationStats = {
  total: number;
  pending: number;
  resolved: number;
  avgResponseTime: string;
};

export function useEscalations(params?: { priority?: "low" | "normal" | "high" | "urgent" | "critical"; limit?: number }) {
  return useQuery<{ escalations: Escalation[]; count: number }, Error>({
    queryKey: ["escalations", params],
    queryFn: async () => {
      try {
        const response = await tenantApi.escalations(params);
        return {
          escalations: (response?.escalations ?? []).map((e) => ({
            id: e.id,
            interactionId: e.interaction_id,
            customerId: e.customer_id,
            customerName: e.customer_name,
            customerUsername: e.customer_username,
            platform: e.platform,
            message: e.message,
            intent: e.intent,
            tone: e.tone,
            confidence: e.confidence,
            suggestedReply: e.suggested_reply,
            createdAt: e.created_at,
            conversationId: e.conversation_id,
            priority: e.priority,
          })),
          count: response?.count ?? 0,
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { escalations: [], count: 0 };
        }
        throw error;
      }
    },
    refetchOnMount: "always",
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useEscalation(escalationId: number | null) {
  return useQuery<EscalationDetail, Error>({
    queryKey: ["escalation", escalationId],
    enabled: Boolean(escalationId),
    queryFn: async () => {
      if (!escalationId) {
        throw new Error("escalationId is required");
      }
      try {
        const response = await tenantApi.escalation(escalationId);
        return {
          escalation: {
            id: response.escalation.id,
            interactionId: response.escalation.interaction_id,
            customerId: response.escalation.customer_id,
            customerName: response.escalation.customer_name,
            customerUsername: response.escalation.customer_username,
            platform: response.escalation.platform,
            message: response.escalation.message,
            intent: response.escalation.intent,
            tone: response.escalation.tone,
            confidence: response.escalation.confidence,
            suggestedReply: response.escalation.suggested_reply,
            createdAt: response.escalation.created_at,
            conversationId: response.escalation.conversation_id,
            priority: response.escalation.priority,
          },
          customer: response.customer,
          conversationHistory: (response.conversation_history ?? []).map((msg) => ({
            id: msg.id,
            author: msg.author,
            body: msg.body,
            sentAt: msg.sent_at,
          })),
          interactions: (response.interactions ?? []).map((interaction) => ({
            id: interaction.id,
            type: interaction.type,
            createdAt: interaction.created_at,
          })),
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          throw new Error("Escalation not found");
        }
        throw error;
      }
    },
  });
}

export function useApproveEscalationReply(escalationId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!escalationId) {
        throw new Error("No escalation selected");
      }
      return tenantApi.approveEscalationReply(escalationId);
    },
    onSuccess: () => {
      toast.success("Reply sent successfully");
      void queryClient.invalidateQueries({ queryKey: ["escalation", escalationId] });
      void queryClient.invalidateQueries({ queryKey: ["escalations"] });
      void queryClient.invalidateQueries({ queryKey: ["escalation-stats"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to approve reply. Please try again.");
      }
    },
  });
}

export function useSendEscalationReply(escalationId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { reply: string; edit?: boolean }) => {
      if (!escalationId) {
        throw new Error("No escalation selected");
      }
      return tenantApi.sendEscalationReply(escalationId, { reply: payload.reply }, payload.edit);
    },
    onSuccess: () => {
      toast.success("Reply sent successfully");
      void queryClient.invalidateQueries({ queryKey: ["escalation", escalationId] });
      void queryClient.invalidateQueries({ queryKey: ["escalations"] });
      void queryClient.invalidateQueries({ queryKey: ["escalation-stats"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to send reply. Please try again.");
      }
    },
  });
}

export function useIgnoreEscalation(escalationId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!escalationId) {
        throw new Error("No escalation selected");
      }
      return tenantApi.ignoreEscalation(escalationId);
    },
    onSuccess: () => {
      toast.success("Escalation ignored");
      void queryClient.invalidateQueries({ queryKey: ["escalation", escalationId] });
      void queryClient.invalidateQueries({ queryKey: ["escalations"] });
      void queryClient.invalidateQueries({ queryKey: ["escalation-stats"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to ignore escalation. Please try again.");
      }
    },
  });
}

export function useResolveEscalation(escalationId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!escalationId) {
        throw new Error("No escalation selected");
      }
      return tenantApi.resolveEscalation(escalationId);
    },
    onSuccess: () => {
      toast.success("Escalation resolved");
      void queryClient.invalidateQueries({ queryKey: ["escalation", escalationId] });
      void queryClient.invalidateQueries({ queryKey: ["escalations"] });
      void queryClient.invalidateQueries({ queryKey: ["escalation-stats"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to resolve escalation. Please try again.");
      }
    },
  });
}

export function useEscalationStats(params?: { startDate?: string; endDate?: string }) {
  return useQuery<EscalationStats, Error>({
    queryKey: ["escalation-stats", params],
    queryFn: async () => {
      try {
        const response = await tenantApi.escalationStats({
          start_date: params?.startDate,
          end_date: params?.endDate,
        });
        return {
          total: response?.total ?? 0,
          pending: response?.pending ?? 0,
          resolved: response?.resolved ?? 0,
          avgResponseTime: response?.avg_response_time ?? "N/A",
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { total: 0, pending: 0, resolved: 0, avgResponseTime: "N/A" };
        }
        throw error;
      }
    },
    refetchInterval: 60000, // Poll every minute
  });
}

