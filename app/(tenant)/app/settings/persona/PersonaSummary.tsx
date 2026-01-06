'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';

export default function PersonaSummary() {
  const { data: aiModeData } = useQuery({
    queryKey: ['ai_mode'],
    queryFn: () => tenantApi.getAIMode(),
  });

  const aiMode = aiModeData?.mode || 'ai';

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
        <p className="text-xs text-gray-500">AI features are managed in the workspace header. Use the header toggle to enable or disable AI for this tenant.</p>
        <div className="mt-3 inline-flex items-center gap-3">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">{aiMode === 'ai' ? 'AI (enabled)' : 'Human (disabled)'}</span>
        </div>
      </div>
    </div>
  );
} 
