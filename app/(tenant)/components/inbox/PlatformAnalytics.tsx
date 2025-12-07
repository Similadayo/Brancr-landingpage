'use client';

import { useInstagramAccountInsights } from '@/app/(tenant)/hooks/useInstagramInsights';
import { InstagramIcon, FacebookIcon } from '../icons';

interface PlatformAnalyticsProps {
  platform: string;
}

export function PlatformAnalytics({ platform }: PlatformAnalyticsProps) {
  const isInstagram = platform.toLowerCase() === 'instagram';
  const isFacebook = platform.toLowerCase() === 'facebook';

  // For now, only Instagram has insights API
  const { data: instagramData, isLoading: instagramLoading, error: instagramError } = useInstagramAccountInsights(
    ['impressions', 'reach', 'profile_views'],
    'day',
    true
  );

  if (!isInstagram && !isFacebook) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-sm text-gray-500 text-center px-4">
          Analytics available for Instagram and Facebook conversations
        </p>
      </div>
    );
  }

  if (isInstagram) {
    if (instagramLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-3" />
          <p className="text-sm text-gray-600">Loading insights...</p>
        </div>
      );
    }

    if (instagramError) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 mx-4">
          <p className="text-sm text-rose-700">
            {instagramError.message || 'Failed to load insights. Please try again.'}
          </p>
        </div>
      );
    }

    if (!instagramData?.insights || instagramData.insights.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <InstagramIcon className="h-8 w-8 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 text-center mb-1">No insights available yet</p>
          <p className="text-xs text-gray-500 text-center">
            Insights will appear after your account has activity
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 pt-2">
          <InstagramIcon className="h-5 w-5 text-pink-600" />
          <h3 className="text-sm font-semibold text-gray-900">Instagram Analytics</h3>
        </div>
        
        <div className="px-4 space-y-3">
          {instagramData.insights.map((metric) => {
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

            return (
              <div key={metric.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2">
                  <h4 className="text-xs font-semibold text-gray-900">{metric.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{metric.description}</p>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-gray-900">
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

  // Facebook placeholder (can be implemented when Facebook insights API is available)
  if (isFacebook) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <FacebookIcon className="h-8 w-8 text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-gray-900 mb-1">Facebook Analytics</p>
        <p className="text-xs text-gray-500 text-center">
          Facebook analytics coming soon
        </p>
      </div>
    );
  }

  return null;
}
