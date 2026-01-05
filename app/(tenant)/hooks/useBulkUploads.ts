'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type BulkSession = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  split_strategy?: string;
  schedule_strategy?: string;
  items_count?: number;
  created_at: string;
};

export function useBulkUploads() {
  return useQuery<BulkSession[], Error>({
    queryKey: ["bulk-uploads"],
    queryFn: async () => {
      try {
        const res = await tenantApi.bulkUploads();
        // Handle different response formats from backend
        const sessions = (res as any).sessions || (res as any).items || (res as any).bulk_uploads || [];
        return sessions as BulkSession[];
      } catch (error) {
        console.error("[useBulkUploads] Error fetching bulk uploads:", error);
        if (error instanceof ApiError) {
          // Return empty array for 404 (not found) or 501 (not implemented)
          if (error.status === 404 || error.status === 501) {
            return [];
          }
          console.error("[useBulkUploads] API Error:", error.status, error.message);
        }
        throw error;
      }
    },
    refetchInterval: 10000,
  });
}

export function useBulkUpload(id: string | null) {
  return useQuery({
    queryKey: ["bulk-upload", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error("id required");
      return tenantApi.bulkUpload(id);
    },
    refetchInterval: 10000,
  });
}

export function useCreateBulkUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/lib/api").BulkUploadRequest) => tenantApi.createBulkUpload(data),
    onSuccess: () => {
      toast.success("Bulk upload created");
      void queryClient.invalidateQueries({ queryKey: ["bulk-uploads"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to create bulk upload");
    },
  });
}

export function useUpdateBulkUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; payload: { split_strategy?: string; schedule_strategy?: string } }) =>
      tenantApi.updateBulkUpload(params.id, params.payload),
    onSuccess: () => {
      toast.success("Bulk upload updated");
      void queryClient.invalidateQueries({ queryKey: ["bulk-uploads"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to update bulk upload");
    },
  });
}

export function useCancelBulkUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.cancelBulkUpload(id),
    onSuccess: () => {
      toast.success("Bulk upload cancelled");
      void queryClient.invalidateQueries({ queryKey: ["bulk-uploads"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to cancel bulk upload");
    },
  });
}


