'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";
import { getUserFriendlyErrorMessage, ErrorMessages } from "@/lib/error-messages";

export type ScheduledPost = {
  id: string;
  name: string;
  caption: string;
  status: "scheduled" | "posting" | "posted" | "failed" | "partial_failed" | "draft" | "cancelled";
  scheduled_at: string | null;
  platforms: string[];
  media_asset_ids: string[];
  attempts: number;
  last_error?: string;
  created_at: string;
  posted_at?: string | null;
  enhance_caption?: boolean; // If true, caption was enhanced with AI; if false/undefined, used as-is
};

export type CampaignStats = {
  scheduled: number;
  published: number;
  draft: number;
};

export function useScheduledPosts(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery<ScheduledPost[], Error>({
    queryKey: ["scheduled-posts", params],
    queryFn: async () => {
      try {
        const response = await tenantApi.scheduledPosts(params);

        // Support both new paginated format (data) and old format (scheduled_posts) for backward compatibility
        const posts = response?.data || response?.scheduled_posts || [];

        if (!Array.isArray(posts)) {
          return [];
        }

        // Normalize array properties
        const normalized = posts.map((post) => ({
          ...post,
          platforms: Array.isArray(post.platforms) ? post.platforms : [],
          media_asset_ids: Array.isArray(post.media_asset_ids) ? post.media_asset_ids : [],
        }));
        return normalized;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });
}

export function useScheduledPost(postId: string) {
  return useQuery<ScheduledPost | null, Error>({
    queryKey: ["scheduled-post", postId],
    queryFn: async () => {
      try {
        const response = await tenantApi.scheduledPost(postId);
        const post = response.post;
        if (!post) {
          return null;
        }
        // Normalize array properties
        return {
          ...post,
          platforms: Array.isArray(post.platforms) ? post.platforms : [],
          media_asset_ids: Array.isArray(post.media_asset_ids) ? post.media_asset_ids : [],
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!postId,
  });
}

export function useCancelScheduledPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => tenantApi.cancelScheduledPost(postId),
    onSuccess: (_, postId) => {
      toast.success("Post cancelled successfully");
      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["scheduled-post", postId] });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        action: 'cancelling post',
        resource: 'post',
      });
      toast.error(message || ErrorMessages.campaign.cancel);
    },
  });
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { postId: string; payload: { caption?: string; scheduled_at?: string; platforms?: string[] } }) =>
      tenantApi.updateScheduledPost(params.postId, params.payload),
    onSuccess: (_, variables) => {
      toast.success("Post updated");
      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["scheduled-post", variables.postId] });
      void queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        action: 'updating post',
        resource: 'post',
      });
      toast.error(message || ErrorMessages.campaign.update);
    },
  });
}

export function useCampaignStats() {
  return useQuery<CampaignStats, Error>({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      try {
        const [scheduledRes, publishedRes, draftsRes] = await Promise.all([
          tenantApi.scheduledPosts({ status: 'scheduled', limit: 1 }),
          tenantApi.scheduledPosts({ status: 'posted', limit: 1 }),
          tenantApi.getDrafts('compose.post')
        ]);

        return {
          scheduled: scheduledRes.pagination?.total ?? 0,
          published: publishedRes.pagination?.total ?? 0,
          draft: draftsRes?.drafts?.length ?? 0,
        };
      } catch (error) {
        console.error("Failed to fetch campaign stats", error);
        // Fallback to 0 if anything fails
        return { scheduled: 0, published: 0, draft: 0 };
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export type PerformanceSummary = {
  period: string;
  engagement_rate: number | null;
  total_impressions: number;
  total_reach: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_posts: number;
  top_performing_post: {
    id: string;
    name: string;
    platform: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
    posted_at: string;
  } | null;
  platform_breakdown: Record<string, {
    posts: number;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
  }>;
};

export function usePerformanceSummary(period: string = "7d") {
  return useQuery<PerformanceSummary, Error>({
    queryKey: ["performance-summary", period],
    queryFn: async () => {
      try {
        return await tenantApi.performanceSummary({ period });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Return empty structure when no data
          return {
            period,
            engagement_rate: null,
            total_impressions: 0,
            total_reach: 0,
            total_likes: 0,
            total_comments: 0,
            total_shares: 0,
            total_posts: 0,
            top_performing_post: null,
            platform_breakdown: {},
          };
        }
        throw error;
      }
    },
    refetchInterval: 300000, // Poll every 5 minutes
  });
}

