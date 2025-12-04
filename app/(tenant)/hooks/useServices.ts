'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Service = {
  id: number;
  name: string;
  description?: string;
  pricing: {
    type: "hourly" | "fixed" | "package";
    rate?: number;
  };
  packages?: Array<{
    name: string;
    price: number;
    duration: string;
    description?: string;
  }>;
  duration?: string;
  deliverables?: string[];
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateServicePayload = {
  name: string;
  description?: string;
  pricing: {
    type: "hourly" | "fixed" | "package";
    rate?: number;
  };
  packages?: Array<{
    name: string;
    price: number;
    duration: string;
    description?: string;
  }>;
  duration?: string;
  deliverables?: string[];
  category?: string;
};

export type UpdateServicePayload = {
  name?: string;
  description?: string;
  pricing?: {
    type: "hourly" | "fixed" | "package";
    rate?: number;
  };
  packages?: Array<{
    name: string;
    price: number;
    duration: string;
    description?: string;
  }>;
  duration?: string;
  deliverables?: string[];
  category?: string;
  is_active?: boolean;
};

export function useServices(filters?: { category?: string; search?: string; limit?: number }) {
  return useQuery<Service[], Error>({
    queryKey: ["services", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.services(filters);
        return response.services || [];
      } catch (error) {
        console.error("Failed to load services:", error);
        return [];
      }
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateServicePayload) => {
      return tenantApi.createService(payload);
    },
    onSuccess: () => {
      toast.success("Service created successfully");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create service");
      }
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ serviceId, payload }: { serviceId: number; payload: UpdateServicePayload }) => {
      return tenantApi.updateService(serviceId, payload);
    },
    onSuccess: () => {
      toast.success("Service updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update service");
      }
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceId: number) => {
      return tenantApi.deleteService(serviceId);
    },
    onSuccess: () => {
      toast.success("Service deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete service");
      }
    },
  });
}

