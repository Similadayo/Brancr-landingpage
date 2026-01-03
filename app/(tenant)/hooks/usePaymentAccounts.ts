'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export type PaymentAccount = {
  id: string;
  account_type: "bank" | "mobile_money" | "cash";
  bank_name?: string;
  account_number?: string;
  account_name: string;
  provider?: string;
  phone_number?: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentAccountPayload = {
  account_type: "bank" | "mobile_money" | "cash";
  bank_name?: string;
  account_number?: string;
  account_name: string;
  provider?: string;
  phone_number?: string;
  description?: string;
  is_default?: boolean;
};

export type UpdatePaymentAccountPayload = {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  provider?: string;
  phone_number?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export function usePaymentAccounts() {
  return useQuery<PaymentAccount[], Error>({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      try {
        const response = await tenantApi.paymentAccounts();
        return response.payment_accounts || [];
      } catch (error) {
        console.error("Failed to load payment accounts:", error);
        return [];
      }
    },
  });
}

export function usePaymentAccount(accountId: string) {
  return useQuery<PaymentAccount | null, Error>({
    queryKey: ["payment-accounts", accountId],
    queryFn: async () => {
      try {
        return await tenantApi.paymentAccount(accountId);
      } catch (error) {
        console.error("Failed to load payment account:", error);
        return null;
      }
    },
    enabled: !!accountId,
  });
}

export function useCreatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePaymentAccountPayload) => {
      return tenantApi.createPaymentAccount(payload);
    },
    onSuccess: () => {
      toast.success("Payment account created successfully");
      void queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create payment account");
      }
    },
  });
}

export function useUpdatePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, payload }: { accountId: string; payload: UpdatePaymentAccountPayload }) => {
      return tenantApi.updatePaymentAccount(accountId, payload);
    },
    onSuccess: () => {
      toast.success("Payment account updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update payment account");
      }
    },
  });
}

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      return tenantApi.deletePaymentAccount(accountId);
    },
    onSuccess: () => {
      toast.success("Payment account deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete payment account");
      }
    },
  });
}

export function useSetDefaultPaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      return tenantApi.setDefaultPaymentAccount(accountId);
    },
    onSuccess: () => {
      toast.success("Default payment account updated");
      void queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to set default payment account");
      }
    },
  });
}

