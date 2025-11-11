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

export function useAnalytics(filters?: Record<string, string>) {
  return useQuery<AnalyticsSnapshot, Error>({
    queryKey: ["analytics", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.analytics(filters);
        const fromApi = response as Record<string, unknown>;

        return {
          kpis: (fromApi.kpis as AnalyticsSnapshot["kpis"]) ?? FALLBACK_ANALYTICS.kpis,
          channelVolume:
            (fromApi.channelVolume as AnalyticsSnapshot["channelVolume"]) ??
            (fromApi.channel_volume as AnalyticsSnapshot["channelVolume"]) ??
            FALLBACK_ANALYTICS.channelVolume,
          campaignPerformance:
            (fromApi.campaignPerformance as AnalyticsSnapshot["campaignPerformance"]) ??
            (fromApi.campaign_performance as AnalyticsSnapshot["campaignPerformance"]) ??
            FALLBACK_ANALYTICS.campaignPerformance,
          responseDistribution:
            (fromApi.responseDistribution as AnalyticsSnapshot["responseDistribution"]) ??
            (fromApi.response_distribution as AnalyticsSnapshot["responseDistribution"]) ??
            FALLBACK_ANALYTICS.responseDistribution,
          teamLeaderboard:
            (fromApi.teamLeaderboard as AnalyticsSnapshot["teamLeaderboard"]) ??
            (fromApi.team_leaderboard as AnalyticsSnapshot["teamLeaderboard"]) ??
            FALLBACK_ANALYTICS.teamLeaderboard,
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

