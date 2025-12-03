'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import {
  ChartIcon,
  EyeIcon,
  VideoCameraIcon,
} from '../../../components/icons';

export default function TikTokAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tiktok-analytics'],
    queryFn: () => tenantApi.tiktokAnalytics(),
  });

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-900">Failed to load analytics</p>
        <p className="mt-1 text-xs text-rose-700">{error?.message || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const analytics = data || {
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
    total_videos: 0,
    average_engagement_rate: 0,
    period: { start_date: '', end_date: '' },
    top_videos: [],
  };

  const engagementRate = analytics.average_engagement_rate
    ? (analytics.average_engagement_rate * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChartIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">TikTok Analytics</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Account-wide analytics and performance insights
            </p>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <VideoCameraIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Videos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.total_videos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <EyeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Views</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(analytics.total_views)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <span className="text-2xl">❤️</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Likes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(analytics.total_likes)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Comments</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(analytics.total_comments)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Rate */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Engagement Rate</h2>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{engagementRate}%</span>
            <span className="text-sm text-gray-500">average engagement rate</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Calculated from likes, comments, and shares across all videos
          </p>
        </div>
      </div>

      {/* Top Videos */}
      {analytics.top_videos && analytics.top_videos.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Videos</h2>
          <div className="mt-4 space-y-3">
            {analytics.top_videos.slice(0, 5).map((video, index) => (
              <div
                key={video.video_id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{video.title || 'Untitled Video'}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <span>👁️ {formatNumber(video.views)}</span>
                    <span>❤️ {formatNumber(video.likes)}</span>
                    <span>💬 {formatNumber(video.comments)}</span>
                    <span>📤 {formatNumber(video.shares)}</span>
                  </div>
                </div>
                <a
                  href={`/app/tiktok/videos/${video.video_id}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Info */}
      {analytics.period && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Analytics period: {new Date(analytics.period.start_date).toLocaleDateString()} -{' '}
            {new Date(analytics.period.end_date).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

