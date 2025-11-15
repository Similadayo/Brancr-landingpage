'use client';

import { useQuery } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";

export type AnalyticsSnapshot = {
  kpis: Array<{ label: string; value: string; delta: string }>;
  channelVolume: Array<{ channel: string; value: number }>;
  campaignPerformance: Array<{ name: string; open: number; click: number }>;
  responseDistribution: Array<{ label: string; value: number }>;
  teamLeaderboard: Array<{ name: string; summary: string }>;
};

const FALLBACK_ANALYTICS: AnalyticsSnapshot = {
  kpis: [
    { label: "Conversations handled", value: "1,248", delta: "+18% vs previous period" },
    { label: "Avg response time", value: "2m 45s", delta: "-32% faster" },
    { label: "Campaign CTR", value: "28%", delta: "+6 points" },
    { label: "AI assisted replies", value: "54%", delta: "+11% adoption" },
  ],
  channelVolume: [
    { channel: "WhatsApp", value: 58 },
    { channel: "Instagram", value: 22 },
    { channel: "Facebook", value: 14 },
    { channel: "TikTok", value: 6 },
  ],
  campaignPerformance: [
    { name: "Welcome Flow", open: 84, click: 52 },
    { name: "Restock Alert", open: 76, click: 33 },
    { name: "VIP Broadcast", open: 68, click: 41 },
    { name: "Giveaway", open: 62, click: 28 },
  ],
  responseDistribution: [
    { label: "< 1 minute", value: 41 },
    { label: "1 – 5 minutes", value: 33 },
    { label: "5 – 15 minutes", value: 16 },
    { label: "> 15 minutes", value: 10 },
  ],
  teamLeaderboard: [
    { name: "Seyi", summary: "312 conversations • 2m avg response" },
    { name: "Ada", summary: "274 conversations • 3m avg response" },
    { name: "Tunde", summary: "198 conversations • 4m avg response" },
    { name: "New Agent", summary: "Onboarding • 6m avg response" },
  ],
};

export function useAnalytics(filters?: { platform?: string; start_date?: string; end_date?: string }) {
  return useQuery<AnalyticsSnapshot, Error>({
    queryKey: ["analytics", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.analytics(filters);
        
        // Transform API response to match AnalyticsSnapshot
        const platformBreakdown = (response?.platform_breakdown || []).map((p) => ({
          channel: p.platform || "Unknown",
          value: p.conversations || 0,
        }));

        // Build KPIs from API response with safe defaults
        const kpis: AnalyticsSnapshot["kpis"] = [
          {
            label: "Scheduled posts",
            value: (response?.scheduled_posts_count ?? 0).toString(),
            delta: "",
          },
          {
            label: "Posted",
            value: (response?.posted_count ?? 0).toString(),
            delta: "",
          },
          {
            label: "Conversations",
            value: (response?.conversations_count ?? 0).toString(),
            delta: "",
          },
          {
            label: "Interactions",
            value: (response?.interactions_count ?? 0).toString(),
            delta: "",
          },
        ];

        return {
          kpis,
          channelVolume: platformBreakdown,
          campaignPerformance: FALLBACK_ANALYTICS.campaignPerformance, // Not in API yet
          responseDistribution: FALLBACK_ANALYTICS.responseDistribution, // Not in API yet
          teamLeaderboard: FALLBACK_ANALYTICS.teamLeaderboard, // Not in API yet
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return FALLBACK_ANALYTICS;
        }
        throw error;
      }
    },
  });
}

