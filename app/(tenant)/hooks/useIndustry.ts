'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Industry = {
  id: string;
  name: string;
  category: string;
  description: string;
  has_products: boolean;
  has_menu: boolean;
  has_services: boolean;
};

export type TenantIndustry = {
  industry_id: string;
  industry_name: string;
  capabilities: {
    has_products: boolean;
    has_menu: boolean;
    has_services: boolean;
  };
};

export const FALLBACK_INDUSTRIES: Industry[] = [
  {
    id: "1",
    name: "Retail & E-commerce",
    category: "Retail",
    description: "Sell physical products online or in-store. Includes inventory management, variants, and stock tracking.",
    has_products: true,
    has_menu: false,
    has_services: false
  },
  {
    id: "2",
    name: "Restaurant & Food",
    category: "Food & Beverage",
    description: "For restaurants, cafes, and food delivery. Manage menus, modifiers, and preparation times.",
    has_products: false,
    has_menu: true,
    has_services: false
  },
  {
    id: "3",
    name: "Professional Services",
    category: "Services",
    description: "For agencies, consultants, and service providers. Manage service packages and hourly rates.",
    has_products: false,
    has_menu: false,
    has_services: true
  },
  {
    id: "4",
    name: "Beauty & Wellness",
    category: "Services",
    description: "Salons, spas, and wellness centers. Manage service lists and appointments.",
    has_products: true, // Often sell products too
    has_menu: false,
    has_services: true
  }
];

export function useIndustries() {
  return useQuery<Industry[], Error>({
    queryKey: ["industries"],
    queryFn: async () => {
      try {
        const response = await tenantApi.getIndustries();
        return response.industries || [];
      } catch (error) {
        // If forbidden (during onboarding), return fallback list to allow user to proceed
        if (error instanceof ApiError && error.status === 403) {
          console.warn("Using fallback industries due to 403 Forbidden (likely during onboarding)");
          return FALLBACK_INDUSTRIES;
        }
        console.error("Failed to load industries:", error);
        // Return fallback on other errors too, to avoid breaking the UI completely
        return FALLBACK_INDUSTRIES;
      }
    },
    retry: false, // Don't retry if it fails, just use fallback
  });
}

export function useTenantIndustry() {
  return useQuery<TenantIndustry | null, Error>({
    queryKey: ["tenant-industry"],
    queryFn: async () => {
      try {
        return await tenantApi.getTenantIndustry();
      } catch (error) {
        // Suppress 403 errors which are expected during onboarding
        if (error instanceof ApiError && error.status === 403) {
          return null;
        }
        console.error("Failed to load tenant industry:", error);
        return null;
      }
    },
    retry: false,
  });
}

export function useSetTenantIndustry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (industryId: string) => {
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
      // Invalidate all industry-related data queries to show existing items for the new industry
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
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

export function useOnboardingIndustry() {
  // const queryClient = useQueryClient(); // Unused
  return useMutation({
    mutationFn: async (industryId: string) => {
      return await tenantApi.onboardingIndustry({ industry_id: industryId });
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

