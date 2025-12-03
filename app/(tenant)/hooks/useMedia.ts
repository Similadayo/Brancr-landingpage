'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type MediaAsset = {
  id: number;
  type: "image" | "video" | "carousel";
  name: string;
  carousel_name?: string | null;
  caption?: string | null;
  urls: string[];
  status: string;
  scheduled_at?: string | null;
  platforms: string[];
  tags: string[];
  campaign?: string | null;
  created_at: string;
  updated_at: string;
  // Computed properties for backward compatibility
  url?: string;
  thumbnail_url?: string;
};

export function useMedia(filters?: { type?: string; tag?: string; campaign?: string; q?: string; limit?: number }) {
  return useQuery<MediaAsset[], Error>({
    queryKey: ["media", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.mediaList(filters);
        // API returns { items: [...], count: number }
        const items = response?.items || [];
        
        // Transform to include computed properties for backward compatibility
        return items.map((item) => ({
          ...item,
          // Use first URL as primary url and thumbnail_url for backward compatibility
          url: item.urls && item.urls.length > 0 ? item.urls[0] : "",
          thumbnail_url: item.urls && item.urls.length > 0 ? item.urls[0] : undefined,
        }));
      } catch (error) {
        // Return empty array on error to prevent crashes
        console.error("Failed to load media:", error);
        return [];
      }
    },
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      // Log FormData contents for debugging
      const entries = Array.from(form.entries());
      console.log('Uploading files:', entries.map(([key, value]) => {
        if (value instanceof File) {
          return { key, name: value.name, type: value.type, size: value.size };
        }
        return { key, value };
      }));
      
      return tenantApi.mediaUpload(form);
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the media list
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      
      // Log success for debugging
      if (data?.assets) {
        console.log('Upload successful, assets created:', data.assets);
        const videoAssets = data.assets.filter((asset: any) => asset.type === 'video');
        const imageAssets = data.assets.filter((asset: any) => asset.type === 'image');
        if (videoAssets.length > 0) {
          console.log(`✅ ${videoAssets.length} video(s) saved successfully`);
        }
        if (imageAssets.length > 0) {
          console.log(`✅ ${imageAssets.length} image(s) saved successfully`);
        }
      }
    },
    onError: (error) => {
      console.error('Upload mutation error:', error);
      
      if (error instanceof ApiError) {
        // Parse detailed JSON error response from API
        const errorMessage = error.body?.error || error.body?.message || error.message;
        let details = "";
        
        if (error.body?.available_fields) {
          details = ` Available fields: ${Array.isArray(error.body.available_fields) ? error.body.available_fields.join(", ") : error.body.available_fields}`;
        }
        
        // More specific error messages
        if (error.status === 400) {
          const message = errorMessage || "Invalid file format or size";
          toast.error(`Upload failed: ${message}${details || ". Please check file format and size."}`);
        } else if (error.status === 413) {
          toast.error("Upload failed: File too large. Maximum file size is 50MB for videos and 10MB for images.");
        } else if (error.status === 415) {
          toast.error("Upload failed: Unsupported file type. Only images and videos are supported.");
        } else {
          toast.error(`Upload failed: ${errorMessage}${details || ""}`);
        }
      } else {
        toast.error("Upload failed. Please try again.");
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


