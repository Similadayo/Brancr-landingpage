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
      return tenantApi.setTenantIndustry({ industry_id: industryId });
    },
    onSuccess: (data) => {
      toast.success(`Industry set to ${data.industry.name}`);
      void queryClient.invalidateQueries({ queryKey: ["tenant-industry"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to set industry");
      }
    },
  });
}

