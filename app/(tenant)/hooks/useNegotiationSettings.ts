'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export type NegotiationSettings = {
  negotiation_mode: 'disabled' | 'range';
  negotiation_min_price?: number;
  negotiation_max_price?: number;
};

export function useNegotiationSettings() {
  return useQuery<NegotiationSettings | null, Error>({
    queryKey: ['negotiation-settings'],
    queryFn: async () => {
      try {
        return await tenantApi.getNegotiationSettings();
      } catch (error) {
        console.error('Failed to load negotiation settings:', error);
        return null;
      }
    },
  });
}

export function useUpdateNegotiationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NegotiationSettings>) => {
      return tenantApi.updateNegotiationSettings(payload);
    },
    onSuccess: () => {
      toast.success('Negotiation settings updated');
      void queryClient.invalidateQueries({ queryKey: ['negotiation-settings'] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error('Failed to update negotiation settings');
    },
  });
}
