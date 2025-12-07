'use client';

import { useInstagramMediaInsights } from '@/app/(tenant)/hooks/useInstagramInsights';

interface MediaInsightsProps {
  mediaId: string | null;
  metrics?: string[];
  period?: 'day' | 'week' | 'days_28' | 'lifetime';
  showSave?: boolean;
}

export function MediaInsights({ 
  mediaId, 
  metrics = ['engagement', 'impressions', 'reach', 'likes', 'comments'],
  period = 'lifetime',
  showSave = false 
}: MediaInsightsProps) {
  const { data, isLoading, error } = useInstagramMediaInsights(mediaId, metrics, period, showSave);

  if (!mediaId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-xs text-gray-600">Loading post insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 rounded border border-rose-200 bg-rose-50 p-2">
        <p className="text-xs text-rose-700">
          {error.message || 'Failed to load post insights'}
        </p>
      </div>
    );
  }

  if (!data?.insights || data.insights.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
      <h4 className="text-xs font-semibold text-gray-900 mb-2">Post Performance</h4>
      <div className="flex flex-wrap gap-3">
        {data.insights.map((metric) => {
          const value = metric.values[0]?.value || 0;
          
          return (
            <div key={metric.id} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600">{metric.title}:</span>
              <span className="text-xs font-semibold text-gray-900">{value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
