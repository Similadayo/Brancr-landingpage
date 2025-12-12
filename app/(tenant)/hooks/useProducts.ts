'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  stock_count?: number;
  availability: "in_stock" | "out_of_stock" | "low_stock";
  is_active: boolean;
  variants?: Record<string, string[]>;
  tags?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  stock_count?: number;
  variants?: Record<string, string[]>;
  tags?: string[];
  images?: string[];
};

export type UpdateProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  negotiation_mode?: "default" | "disabled" | "range";
  negotiation_min_price?: number;
  negotiation_max_price?: number;
  stock_count?: number;
  availability?: "in_stock" | "out_of_stock" | "low_stock";
  is_active?: boolean;
  variants?: Record<string, string[]>;
  tags?: string[];
  images?: string[];
};

export function useProducts(filters?: { category?: string; search?: string; limit?: number }) {
  return useQuery<Product[], Error>({
    queryKey: ["products", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.products(filters);
        return response.products || [];
      } catch (error) {
        console.error("Failed to load products:", error);
        return [];
      }
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      return tenantApi.createProduct(payload);
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create product");
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, payload }: { productId: number; payload: UpdateProductPayload }) => {
      return tenantApi.updateProduct(productId, payload);
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update product");
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      return tenantApi.deleteProduct(productId);
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete product");
      }
    },
  });
}

