'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Industry = {
  id: number;
  name: string;
  category: string;
  description: string;
  has_products: boolean;
  has_menu: boolean;
  has_services: boolean;
};

export type TenantIndustry = {
  industry_id: number;
  industry_name: string;
  capabilities: {
    has_products: boolean;
    has_menu: boolean;
    has_services: boolean;
  };
};

export function useIndustries() {
  return useQuery<Industry[], Error>({
    queryKey: ["industries"],
    queryFn: async () => {
      try {
        const response = await tenantApi.getIndustries();
        return response.industries || [];
      } catch (error) {
        console.error("Failed to load industries:", error);
        return [];
      }
    },
  });
}

export function useTenantIndustry() {
  return useQuery<TenantIndustry | null, Error>({
    queryKey: ["tenant-industry"],
    queryFn: async () => {
      try {
        return await tenantApi.getTenantIndustry();
      } catch (error) {
        console.error("Failed to load tenant industry:", error);
        return null;
      }
    },
  });
}

export function useSetTenantIndustry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (industryId: number) => {
      try {
        return await tenantApi.setTenantIndustry({ industry_id: industryId });
      } catch (error) {
        // Log detailed error for debugging
        console.error("Failed to set tenant industry:", error);
        if (error instanceof ApiError) {
          console.error("API Error details:", {
            status: error.status,
            message: error.message,
            body: error.body,
          });
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Industry updated to ${data.industry.name}`);
      // Invalidate industry query to refresh capabilities
      void queryClient.invalidateQueries({ queryKey: ["tenant-industry"] });
      // Navigation will automatically update based on new capabilities
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // Show more detailed error message
        const errorMessage = error.body?.error || error.message || "Failed to update industry";
        toast.error(`Failed to update industry: ${errorMessage}`);
        console.error("Industry update error:", {
          status: error.status,
          message: error.message,
          body: error.body,
        });
      } else {
        toast.error("Failed to update industry. Please try again.");
        console.error("Unknown error:", error);
      }
    },
  });
}

