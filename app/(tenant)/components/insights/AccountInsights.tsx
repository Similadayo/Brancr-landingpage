'use client';

import { useInstagramAccountInsights } from '@/app/(tenant)/hooks/useInstagramInsights';
import { translateInstagramMetric } from '@/app/(tenant)/utils/instagramInsightsTranslations';

interface AccountInsightsProps {
  period?: 'day' | 'week' | 'days_28' | 'lifetime';
  metrics?: string[];
  save?: boolean;
}

export function AccountInsights({ 
  period = 'day', 
  metrics = ['impressions', 'reach', 'profile_views'],
  save = true 
}: AccountInsightsProps) {
  const { data, isLoading, error } = useInstagramAccountInsights(metrics, period, save);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-sm text-gray-600">Loading insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm text-rose-700">
          {error.message || 'Failed to load insights. Please try again.'}
        </p>
      </div>
    );
  }

  if (!data?.insights || data.insights.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          No insights available yet. Insights will appear after your account has activity.
        </p>
      </div>
    );
  }

  const periodLabel = period === 'day' ? "Today's" : period === 'week' ? "This Week's" : period === 'days_28' ? "Last 28 Days'" : "All Time";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{periodLabel} Performance</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.insights.map((metric) => {
          const latestValue = metric.values[metric.values.length - 1];
          const previousValue = metric.values.length > 1 
            ? metric.values[metric.values.length - 2] 
            : null;
          
          const change = previousValue 
            ? latestValue.value - previousValue.value 
            : null;
          const changePercent = previousValue && previousValue.value > 0
            ? ((change! / previousValue.value) * 100).toFixed(1)
            : null;

          // Translate to English
          const translated = translateInstagramMetric(
            metric.name,
            metric.title,
            metric.description
          );

          return (
            <div key={metric.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-gray-900">{translated.title}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{translated.description}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {latestValue.value.toLocaleString()}
                </span>
                {change !== null && (
                  <span className={`text-xs font-medium ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toLocaleString()}
                    {changePercent && ` (${changePercent}%)`}
                  </span>
                )}
              </div>
              {latestValue.end_time && (
                <div className="mt-2 text-[10px] text-gray-400">
                  {new Date(latestValue.end_time).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
