"use client";

import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

export type AIMetricsRaw = {
    total_interactions: number;
    ai_resolution_rate: number;
    human_intervention_rate: number;
    active_conversations: number;
    avg_response_time: string;
    orders_influenced: number;
};

export type EscalationReason = {
    reason: string;
    count: number;
    percentage: number;
};

export type ConversationSource = {
    source: string;
    count: number;
    ai_handled: number;
    human_handled: number;
};

export function useAIMetrics(period: "24h" | "7d" | "30d" = "7d") {
    return useQuery<AIMetricsRaw>({
        queryKey: ["ai-metrics", period],
        queryFn: async () => {
            try {
                const data = await tenantApi.aiMetrics({ period });
                return data;
            } catch (error) {
                // Fallback for development/mocking if API fails
                console.warn("Failed to fetch AI metrics, using fallback data", error);
                return {
                    total_interactions: 0,
                    ai_resolution_rate: 0,
                    human_intervention_rate: 0,
                    active_conversations: 0,
                    avg_response_time: "0s",
                    orders_influenced: 0,
                };
            }
        },
        // Refresh every 5 minutes
        staleTime: 5 * 60 * 1000,
    });
}

export function useEscalationReasons(period: "24h" | "7d" | "30d" = "7d") {
    return useQuery<EscalationReason[]>({
        queryKey: ["escalation-reasons", period],
        queryFn: async () => {
            try {
                const response = await tenantApi.escalationReasons({ period });
                return response.reasons;
            } catch (error) {
                return [];
            }
        },
    });
}

export function useConversationAttribution(period: "24h" | "7d" | "30d" = "7d") {
    return useQuery<ConversationSource[]>({
        queryKey: ["conversation-attribution", period],
        queryFn: async () => {
            try {
                const response = await tenantApi.conversationAttribution({ period });
                return response.sources;
            } catch (error) {
                return [];
            }
        },
    });
}
