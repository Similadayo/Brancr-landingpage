'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantApi, ApiError } from '@/lib/api';

export interface InsightValue {
  value: number;
  end_time?: string;
}

export interface InsightMetric {
  name: string;
  period: string;
  title: string;
  description: string;
  id: string;
  values: InsightValue[];
}

export interface AccountInsightsResponse {
  success: boolean;
  insights: InsightMetric[];
  account_id: string;
  period: string;
}

export interface MediaInsightsResponse {
  success: boolean;
  insights: InsightMetric[];
  media_id: string;
  period: string;
}

export function useInstagramAccountInsights(
  metrics: string[] = ['reach', 'profile_views', 'follower_count'],
  period: 'day' | 'week' | 'days_28' | 'lifetime' = 'day',
  save: boolean = false
) {
  return useQuery<AccountInsightsResponse, Error>({
    queryKey: ['instagram-account-insights', metrics.join(','), period, save],
    queryFn: async () => {
      try {
        return await tenantApi.getInstagramAccountInsights({
          metrics: metrics.join(','),
          period,
          save,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          throw new Error('Instagram account not connected');
        }
        throw error;
      }
    },
    refetchInterval: period === 'day' ? 5 * 60 * 1000 : undefined, // Refetch every 5 min for daily
    retry: 2,
  });
}

export function useInstagramMediaInsights(
  mediaId: string | null,
  metrics: string[] = ['likes', 'comments', 'shares', 'saves'],
  period: 'day' | 'week' | 'days_28' | 'lifetime' = 'lifetime',
  save: boolean = false
) {
  return useQuery<MediaInsightsResponse, Error>({
    queryKey: ['instagram-media-insights', mediaId, metrics.join(','), period, save],
    queryFn: async () => {
      if (!mediaId) {
        throw new Error('Media ID is required');
      }
      try {
        return await tenantApi.getInstagramMediaInsights(mediaId, {
          metrics: metrics.join(','),
          period,
          save,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          throw new Error('Media insights not available');
        }
        throw error;
      }
    },
    enabled: !!mediaId, // Only fetch if mediaId is provided
    retry: 2,
  });
}
