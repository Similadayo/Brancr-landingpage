'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Order = {
  id: string;
  order_number: string;
  payment_reference: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number;
  currency: string;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  platform: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payment_instructions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_auto_created?: boolean;
  conversation_id?: number | string;
};

export type OrderStats = {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  average_order_value: number;
  currency: string;
};

export function useOrders(filters?: { status?: string; platform?: string; limit?: number; offset?: number }) {
  return useQuery<{ orders: Order[]; count: number }, Error>({
    queryKey: ["orders", filters],
    queryFn: async () => {
      try {
        return await tenantApi.orders(filters);
      } catch (error) {
        console.error("Failed to load orders:", error);
        return { orders: [], count: 0 };
      }
    },
  });
}

export function useOrder(orderId: string | number) {
  return useQuery<Order | null, Error>({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      try {
        return await tenantApi.order(orderId);
      } catch (error) {
        console.error("Failed to load order:", error);
        return null;
      }
    },
    enabled: !!orderId,
  });
}

export function useOrderStats() {
  return useQuery<OrderStats | null, Error>({
    queryKey: ["orders", "stats"],
    queryFn: async () => {
      try {
        return await tenantApi.orderStats();
      } catch (error) {
        console.error("Failed to load order stats:", error);
        return null;
      }
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string | number; payload: { status?: "pending" | "confirmed" | "processing" | "completed" | "cancelled"; notes?: string } }) => {
      return tenantApi.updateOrder(orderId, payload);
    },
    onSuccess: (_, variables) => {
      toast.success("Order updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update order");
      }
    },
  });
}

export function useConfirmOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string | number; payload: { payment_reference: string; notes?: string } }) => {
      return tenantApi.confirmOrderPayment(orderId, payload);
    },
    onSuccess: (_, variables) => {
      toast.success("Payment confirmed successfully");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "stats"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to confirm payment");
      }
    },
  });
}

