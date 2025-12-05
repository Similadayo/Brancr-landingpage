'use client';

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export function useGenerateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: number) => {
      return tenantApi.generateReceipt(paymentId);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Receipt generated successfully");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to generate receipt");
      }
    },
  });
}

