'use client';

import { useState, useMemo } from "react";
import { useAnalytics } from "@/app/(tenant)/hooks/useAnalytics";
import { EmptyState } from "@/app/(tenant)/components/analytics/EmptyState";
import { getUserFriendlyErrorMessage, ErrorMessages } from "@/lib/error-messages";
import {
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  RocketIcon,
  CheckCircleIcon,
  InboxIcon,
  FireIcon,
  TrendingUpIcon,
  ClockIcon,
} from "../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";

const DATE_FILTERS = ["Last 7 days", "Last 30 days", "Quarter to date", "Custom"];
const CHANNEL_FILTERS = ["All channels", "WhatsApp", "Instagram", "Facebook", "TikTok"];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS[1]);
  const [channelFilter, setChannelFilter] = useState(CHANNEL_FILTERS[0]);

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    if (dateFilter === "Last 7 days") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (dateFilter === "Last 30 days") {
      startDate.setDate(endDate.getDate() - 30);
    } else if (dateFilter === "Quarter to date") {
      const quarterStartMonth = Math.floor(endDate.getMonth() / 3) * 3;
      startDate.setMonth(quarterStartMonth, 1);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
  }, [dateFilter]);

  // Build API filters
  const apiFilters = useMemo(() => {
    const filters: { platform?: string; start_date?: string; end_date?: string } = {
      ...dateRange,
    };
    if (channelFilter !== "All channels") {
      filters.platform = channelFilter.toLowerCase();
    }
    return filters;
  }, [channelFilter, dateRange]);

  const { data: analytics, isLoading, error } = useAnalytics(apiFilters);

  const isEmpty = !analytics?.summary?.has_data;

  const kpiCards = [
    {
      label: "SCHEDULED POSTS",
      value: analytics?.summary?.scheduled_posts ?? 0,
      description: "Content queued across all platforms",
      icon: <RocketIcon className="w-6 h-6" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "POSTED",
      value: analytics?.summary?.posted ?? 0,
      description: "Successfully published content",
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "CONVERSATIONS",
      value: analytics?.summary?.conversations ?? 0,
      description: "Active conversations across all channels",
      icon: <InboxIcon className="w-6 h-6" />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "INTERACTIONS",
      value: analytics?.summary?.interactions ?? 0,
      description: "Total interactions and engagements",
      icon: <FireIcon className="w-6 h-6" />,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  // Filter active channels (count > 0)
  const activeChannels = useMemo(() => {
    return analytics?.volume_by_channel?.data?.filter(ch => ch.count > 0) || [];
  }, [analytics]);

  // Filter active platforms (conversations > 0 or posts > 0)
  const activePlatforms = useMemo(() => {
    return analytics?.platforms?.filter(
      p => p.conversations > 0 || p.posts > 0
    ) || [];
  }, [analytics]);

  // Response time segments
  const responseTimeSegments = useMemo(() => {
    if (!analytics?.response_time_distribution?.data) return [];
    const data = analytics.response_time_distribution.data;
    return [
      { key: 'under_1_min', label: '< 1 minute', color: '#3b82f6', ...data.under_1_min },
      { key: '1_to_5_min', label: '1 - 5 minutes', color: '#10b981', ...data['1_to_5_min'] },
      { key: '5_to_15_min', label: '5 - 15 minutes', color: '#f59e0b', ...data['5_to_15_min'] },
      { key: 'over_15_min', label: '> 15 minutes', color: '#ef4444', ...data.over_15_min },
    ].filter(s => s.percentage > 0);
  }, [analytics]);

  // Response distribution data
  const responseDistribution = useMemo(() => {
    if (!analytics?.response_distribution) return [];
    const dist = analytics.response_distribution;
    return [
      { label: 'Auto Reply', value: dist.auto_reply.percentage, count: dist.auto_reply.count, color: '#635BFF' },
      { label: 'Manual', value: dist.manual.percentage, count: dist.manual.count, color: '#34D399' },
      { label: 'Escalated', value: dist.escalated.percentage, count: dist.escalated.count, color: '#F59E0B' },
    ].filter(r => r.value > 0);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Analytics & Insights</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor messaging efficiency and channel health
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <div className="w-44">
              <Select
                value={dateFilter}
                onChange={(value) => setDateFilter(value || dateFilter)}
                searchable={false}
                buttonClassName="border-0 bg-transparent shadow-none px-0 py-0 text-sm font-semibold text-gray-900 focus:ring-0"
                options={DATE_FILTERS.map((filter) => ({ value: filter, label: filter }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <div className="w-44">
              <Select
                value={channelFilter}
                onChange={(value) => setChannelFilter(value || channelFilter)}
                searchable={false}
                buttonClassName="border-0 bg-transparent shadow-none px-0 py-0 text-sm font-semibold text-gray-900 focus:ring-0"
                options={CHANNEL_FILTERS.map((filter) => ({ value: filter, label: filter }))}
              />
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">
            {getUserFriendlyErrorMessage(error, {
              action: 'loading analytics',
              resource: 'analytics',
            }) || ErrorMessages.analytics.load}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-rose-700 hover:text-rose-900 underline"
          >
            Refresh page
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{kpi.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {isEmpty ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        kpi.value.toLocaleString()
                      )}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">{kpi.description}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.color} transition group-hover:scale-110`}>
                    {kpi.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Engagement Metrics Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUpIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Engagement Metrics</h2>
            </div>
            <p className="mb-6 text-xs text-gray-500">
              Performance metrics across all published posts
            </p>
            {(() => {
              // Debug logging
              const hasEngagement = !!analytics?.engagement;
              const postsWithAnalytics = analytics?.engagement?.posts_with_analytics ?? 0;
              const shouldShow = hasEngagement && postsWithAnalytics > 0;
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[AnalyticsPage] Engagement Metrics:', {
                  hasEngagement,
                  postsWithAnalytics,
                  shouldShow,
                  engagement: analytics?.engagement,
                });
              }

              return shouldShow ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Impressions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.total_impressions.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.engagement.posts_with_analytics} posts
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Reach</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.total_reach.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Unique accounts</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Avg Engagement Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.avg_engagement_rate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Across all posts</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Likes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.total_likes.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Comments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.total_comments.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Shares</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagement.total_shares.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="No engagement data available yet"
                  hint="Engagement metrics will appear after your posts receive views, likes, and comments"
                />
              );
            })()}
          </section>

          {/* Charts Section */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Volume by Channel */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUpIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Volume by Channel</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">
                Percentage distribution of connected channels
              </p>
              {analytics?.volume_by_channel?.has_data && activeChannels.length > 0 ? (
                <div className="space-y-4">
                  {activeChannels.map((channel) => (
                    <div key={channel.platform} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 capitalize">{channel.platform}</span>
                        <span className="text-gray-500">{channel.count} conversations</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100">
                        <div
                          className="h-2.5 rounded-full bg-primary transition-all"
                          style={{ width: `${channel.percentage}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No channel data available"
                  hint="Connect channels and start conversations to see data"
                />
              )}
            </div>

            {/* Response Distribution */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Response Distribution</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">Breakdown of response types across conversations</p>
              {responseDistribution.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="relative h-40 w-40 shrink-0">
                    {(() => {
                      const total = responseDistribution.reduce((sum, r) => sum + r.value, 0);
                      let acc = 0;
                      const slices = responseDistribution.map((r) => {
                        const start = acc / (total || 1);
                        acc += r.value;
                        const end = acc / (total || 1);
                        return `${r.color} ${start * 360}deg ${end * 360}deg`;
                      });
                      const bg = `conic-gradient(${slices.join(", ") || "#e5e7eb 0deg 360deg"})`;
                      return <div className="h-full w-full rounded-full" style={{ background: bg }} />;
                    })()}
                    <div className="absolute inset-6 rounded-full bg-white" />
                  </div>
                  <div className="flex-1 space-y-2 text-xs text-gray-600">
                    {responseDistribution.map((r) => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: r.color }}
                          />
                          {r.label}
                        </span>
                        <span className="font-semibold text-gray-900">{r.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="No response data available"
                  hint="Response distribution will appear after conversations are handled"
                />
              )}
            </div>
          </section>

          {/* Response Time Distribution & Platform Comparison */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Response Time Distribution */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Response Time Distribution</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">
                Time between inbound messages and first reply (Real data from actual conversations)
              </p>
              {analytics?.response_time_distribution?.has_data && responseTimeSegments.length > 0 ? (
                <div className="grid gap-3">
                  {responseTimeSegments.map((segment) => (
                    <div
                      key={segment.key}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-sm text-gray-700">{segment.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{segment.percentage.toFixed(1)}%</span>
                        <span className="text-xs text-gray-500">({segment.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No response time data available yet"
                  hint="Response times will appear after you start replying to messages"
                />
              )}
            </div>

            {/* Platform Comparison */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUpIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Platform Comparison</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">Conversation volume by platform</p>
              {activePlatforms.length > 0 ? (
                <div className="space-y-3">
                  {activePlatforms.map((platform) => (
                    <div key={platform.platform} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 capitalize">{platform.platform}</span>
                        <span className="text-gray-500">
                          {platform.conversations} conversations
                          {platform.posts > 0 && ` • ${platform.posts} posts`}
                        </span>
                      </div>
                      {platform.engagement_rate > 0 && (
                        <div className="text-xs text-gray-600">
                          Engagement Rate: {platform.engagement_rate.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No platform data"
                  hint="Start conversations or post content to see platform metrics"
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
