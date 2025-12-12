'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Payment = {
  id: number;
  order_id: number;
  order_number: string;
  payment_reference: string;
  amount: number;
  currency: string;
  status: "pending" | "verified" | "confirmed" | "disputed" | "failed";
  verification_status: "pending" | "verified" | "disputed";
  customer_name: string;
  customer_phone?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  verified_at?: string;
  disputed_at?: string;
  receipt_id?: string;
  receipt_url?: string;
};

export function usePayments(filters?: { status?: string; verification_status?: string; limit?: number; offset?: number }) {
  return useQuery<{ payments: Payment[]; count: number }, Error>({
    queryKey: ["payments", filters],
    queryFn: async () => {
      try {
        return await tenantApi.payments(filters);
      } catch (error) {
        console.error("Failed to load payments:", error);
        return { payments: [], count: 0 };
      }
    },
  });
}

export function usePayment(paymentId: number) {
  return useQuery<Payment | null, Error>({
    queryKey: ["payments", paymentId],
    queryFn: async () => {
      try {
        return await tenantApi.payment(paymentId);
      } catch (error) {
        console.error("Failed to load payment:", error);
        return null;
      }
    },
    enabled: !!paymentId,
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, orderId, payload }: { paymentId: number; orderId?: number; payload: { transaction_id?: string; notes?: string } }) => {
      return tenantApi.verifyPayment(paymentId, payload);
    },
    onSuccess: (_, variables) => {
      toast.success("Payment verified successfully");
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payments", variables.paymentId] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.orderId) {
        void queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to verify payment");
      }
    },
  });
}

export function useDisputePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, payload }: { paymentId: number; payload: { reason?: string; notes?: string } }) => {
      return tenantApi.disputePayment(paymentId, payload);
    },
    onSuccess: (_, variables) => {
      toast.success("Payment marked as disputed");
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payments", variables.paymentId] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to dispute payment");
      }
    },
  });
}

