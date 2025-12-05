'use client';

import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

export function usePortalOrder(token: string) {
  return useQuery({
    queryKey: ["portal-order", token],
    queryFn: () => tenantApi.portalOrder(token),
    enabled: !!token,
    retry: false,
  });
}

export function usePortalOrders(token: string) {
  return useQuery({
    queryKey: ["portal-orders", token],
    queryFn: () => tenantApi.portalOrders(token),
    enabled: !!token,
    retry: false,
  });
}

