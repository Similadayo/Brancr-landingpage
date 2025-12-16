'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-messages';

export default function PersonaSummary() {
  const queryClient = useQueryClient();
  const { data: aiModeData, isLoading: isLoadingAIMode } = useQuery({
    queryKey: ['ai_mode'],
    queryFn: () => tenantApi.getAIMode(),
  });

  const aiMode = aiModeData?.mode || 'ai';
  const [pendingAIMode, setPendingAIMode] = useState<'ai' | 'human'>(aiMode);

  const updateAIModeMutation = useMutation({
    mutationFn: (mode: 'ai' | 'human') => tenantApi.updateAIMode(mode),
    onSuccess: (data) => {
      toast.success(`AI mode set to ${data.mode === 'ai' ? 'AI (enabled)' : 'Human (disabled)'}`);
      void queryClient.invalidateQueries({ queryKey: ['ai_mode'] });
    },
    onError: (err) => {
      const msg = getUserFriendlyErrorMessage(err, { action: 'updating AI mode', resource: 'AI mode' });
      toast.error(msg || 'Failed to update AI mode');
    },
  });

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">AI Assistant</h4>
          <p className="text-xs text-gray-500">Quickly enable or disable AI features for your workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = pendingAIMode === 'ai' ? 'human' : 'ai';
              setPendingAIMode(next);
              updateAIModeMutation.mutate(next);
            }}
            className={`${pendingAIMode === 'ai' ? 'bg-primary' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            disabled={updateAIModeMutation.isPending || isLoadingAIMode}
            aria-pressed={pendingAIMode === 'ai' ? 'true' : 'false'}
          >
            <span className="sr-only">Toggle AI Assistant</span>
            <span
              className={`${pendingAIMode === 'ai' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {pendingAIMode === 'ai' ? 'AI' : 'Human'}
          </span>
        </div>
      </div>
    </div>
  );
}
