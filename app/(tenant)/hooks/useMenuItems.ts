'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type MenuItem = {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  preparation_time?: number;
  dietary_info?: string[];
  spice_level?: "mild" | "medium" | "hot" | "very_hot";
  availability: "available" | "unavailable" | "limited";
  is_active: boolean;
  images?: string[];
  created_at: string;
  updated_at: string;
};

export type CreateMenuItemPayload = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  preparation_time?: number;
  dietary_info?: string[];
  spice_level?: "mild" | "medium" | "hot" | "very_hot";
  images?: string[];
};

export type UpdateMenuItemPayload = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  preparation_time?: number;
  dietary_info?: string[];
  spice_level?: "mild" | "medium" | "hot" | "very_hot";
  availability?: "available" | "unavailable" | "limited";
  is_active?: boolean;
  images?: string[];
};

export function useMenuItems(filters?: { category?: string; search?: string; limit?: number }) {
  return useQuery<MenuItem[], Error>({
    queryKey: ["menu-items", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.menuItems(filters);
        return response.menu_items || [];
      } catch (error) {
        console.error("Failed to load menu items:", error);
        return [];
      }
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMenuItemPayload) => {
      return tenantApi.createMenuItem(payload);
    },
    onSuccess: () => {
      toast.success("Menu item created successfully");
      void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create menu item");
      }
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ menuItemId, payload }: { menuItemId: number; payload: UpdateMenuItemPayload }) => {
      return tenantApi.updateMenuItem(menuItemId, payload);
    },
    onSuccess: () => {
      toast.success("Menu item updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update menu item");
      }
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (menuItemId: number) => {
      return tenantApi.deleteMenuItem(menuItemId);
    },
    onSuccess: () => {
      toast.success("Menu item deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete menu item");
      }
    },
  });
}

