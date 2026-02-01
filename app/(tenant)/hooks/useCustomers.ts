'use client';

import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

export type Customer = {
  id: string;
  channel: string;
  platform_id: string;
  display_name: string;
  username?: string;
  profile_pic_url?: string;
  last_message_at: string;
  created_at: string;
  total_paid: number;
  last_paid_at?: string | null;
};

export type CustomerProfile = {
  customer: {
    id: string;
    channel: string;
    platform_id: string;
    display_name: string;
    username?: string;
    profile_pic_url?: string;
    last_message_at: string;
    created_at: string;
  };
  payment_summary: {
    has_paid: boolean;
    payment_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    verified_at?: string | null;
    receipt_url?: string;
    portal_url?: string;
    portal_token?: string;
  };
  orders: Array<{
    id: string;
    order_number: string;
    payment_reference: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    confirmed_at?: string;
    completed_at?: string;
  }>;
  requirement_submissions: Array<{
    id: string;
    order_id: string;
    order_item_id: string;
    requirement_id: string;
    requirement_label: string;
    requirement_data_type: string;
    value: string;
    verified: boolean;
    created_at: string;
  }>;
};

export function useCustomers(filters?: { paid?: boolean; limit?: number; offset?: number }) {
  return useQuery<{ customers: Customer[]; count: number; total: number; limit: number; offset: number }, Error>({
    queryKey: ["customers", filters],
    queryFn: async () => {
      try {
        return await tenantApi.customers(filters);
      } catch (error) {
        console.error("Failed to load customers:", error);
        return { customers: [], count: 0, total: 0, limit: filters?.limit ?? 20, offset: filters?.offset ?? 0 };
      }
    },
  });
}

export function useCustomer(customerId: string) {
  return useQuery<CustomerProfile | null, Error>({
    queryKey: ["customers", customerId],
    queryFn: async () => {
      try {
        return await tenantApi.customer(customerId);
      } catch (error) {
        console.error("Failed to load customer:", error);
        return null;
      }
    },
    enabled: !!customerId,
  });
}
