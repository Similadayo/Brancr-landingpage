'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type MediaAsset = {
  id: string;
  type: "image" | "video" | "carousel";
  url: string;
  thumbnail_url?: string;
  tags?: string[];
  caption?: string;
  created_at: string;
};

export function useMedia(filters?: { type?: string; tags?: string; campaign?: string; q?: string; page?: string }) {
  return useQuery<MediaAsset[], Error>({
    queryKey: ["media", filters],
    queryFn: async () => {
      const response = await tenantApi.mediaList(filters);
      return response.assets as MediaAsset[];
    },
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => tenantApi.mediaUpload(form),
    onSuccess: () => {
      toast.success("Media uploaded");
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // Parse detailed JSON error response from API
        const errorMessage = error.body?.error || error.body?.message || error.message;
        let details = "";
        
        if (error.body?.available_fields) {
          details = ` Available fields: ${Array.isArray(error.body.available_fields) ? error.body.available_fields.join(", ") : error.body.available_fields}`;
        }
        
        if (error.status === 400) {
          toast.error(`Upload failed: ${errorMessage}${details || ". Please check file format and size."}`);
        } else {
          toast.error(`Upload failed: ${errorMessage}${details || ""}`);
        }
      } else {
        toast.error("Upload failed");
      }
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assetId: string) => tenantApi.mediaDelete(assetId),
    onSuccess: () => {
      toast.success("Media deleted");
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Delete failed");
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { assetId: string; payload: { tags?: string[]; caption?: string; campaign?: string | null } }) =>
      tenantApi.mediaUpdate(params.assetId, params.payload),
    onSuccess: () => {
      toast.success("Media updated");
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Update failed");
    },
  });
}


