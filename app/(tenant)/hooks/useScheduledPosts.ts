'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type ScheduledPost = {
  id: string;
  name: string;
  caption: string;
  status: "scheduled" | "posting" | "posted" | "failed" | "cancelled";
  scheduled_at: string;
  platforms: string[];
  media_asset_ids: string[];
  attempts: number;
  last_error?: string;
  created_at: string;
  posted_at?: string;
};

export function useScheduledPosts() {
  return useQuery<ScheduledPost[], Error>({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      try {
        const response = await tenantApi.scheduledPosts();
        const posts = response?.posts;
        if (!Array.isArray(posts)) {
          return [];
        }
        // Normalize array properties
        return posts.map((post) => ({
          ...post,
          platforms: Array.isArray(post.platforms) ? post.platforms : [],
          media_asset_ids: Array.isArray(post.media_asset_ids) ? post.media_asset_ids : [],
        }));
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
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to cancel post");
      }
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
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update post");
      }
    },
  });
}

