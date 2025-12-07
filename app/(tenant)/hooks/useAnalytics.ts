'use client';

import { useQuery } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";

export interface AnalyticsResponse {
  summary: {
    scheduled_posts: number;
    posted: number;
    conversations: number;
    interactions: number;
    has_data: boolean;
  };
  engagement: {
    total_impressions: number;
    total_reach: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    avg_engagement_rate: number;
    posts_with_analytics: number;
  };
  response_distribution: {
    auto_reply: { count: number; percentage: number };
    manual: { count: number; percentage: number };
    escalated: { count: number; percentage: number };
  };
  response_time_distribution: {
    data: {
      under_1_min: { count: number; percentage: number };
      "1_to_5_min": { count: number; percentage: number };
      "5_to_15_min": { count: number; percentage: number };
      over_15_min: { count: number; percentage: number };
    };
    has_data: boolean;
    total: number;
  };
  volume_by_channel: {
    data: Array<{
      platform: string;
      count: number;
      percentage: number;
    }>;
    has_data: boolean;
    total: number;
  };
  platforms: Array<{
    platform: string;
    posts: number;
    conversations: number;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
  }>;
  date_range: {
    start: string;
    end: string;
  };
}

export function useAnalytics(filters?: { platform?: string; start_date?: string; end_date?: string }) {
  return useQuery<AnalyticsResponse, Error>({
    queryKey: ["analytics", filters],
    queryFn: async () => {
      try {
        return await tenantApi.analytics(filters);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Return empty structure when no data
          const today = new Date().toISOString().split('T')[0];
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return {
            summary: {
              scheduled_posts: 0,
              posted: 0,
              conversations: 0,
              interactions: 0,
              has_data: false,
            },
            engagement: {
              total_impressions: 0,
              total_reach: 0,
              total_likes: 0,
              total_comments: 0,
              total_shares: 0,
              avg_engagement_rate: 0,
              posts_with_analytics: 0,
            },
            response_distribution: {
              auto_reply: { count: 0, percentage: 0 },
              manual: { count: 0, percentage: 0 },
              escalated: { count: 0, percentage: 0 },
            },
            response_time_distribution: {
              data: {
                under_1_min: { count: 0, percentage: 0 },
                "1_to_5_min": { count: 0, percentage: 0 },
                "5_to_15_min": { count: 0, percentage: 0 },
                over_15_min: { count: 0, percentage: 0 },
              },
              has_data: false,
              total: 0,
            },
            volume_by_channel: {
              data: [],
              has_data: false,
              total: 0,
            },
            platforms: [],
            date_range: {
              start: thirtyDaysAgo.toISOString().split('T')[0],
              end: today,
            },
          };
        }
        throw error;
      }
    },
  });
}
