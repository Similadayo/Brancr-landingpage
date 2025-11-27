'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAnalytics } from "@/app/(tenant)/hooks/useAnalytics";
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
  UsersIcon,
} from "../components/icons";

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

  const kpiCards = [
    {
      label: "Scheduled Posts",
      value: analytics?.kpis?.[0]?.value ?? "0",
      description: "Content queued across all platforms",
      icon: <RocketIcon className="w-6 h-6" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Posted",
      value: analytics?.kpis?.[1]?.value ?? "0",
      description: "Successfully published content",
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Conversations",
      value: analytics?.kpis?.[2]?.value ?? "0",
      description: "Active conversations across all channels",
      icon: <InboxIcon className="w-6 h-6" />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Interactions",
      value: analytics?.kpis?.[3]?.value ?? "0",
      description: "Total interactions and engagements",
      icon: <FireIcon className="w-6 h-6" />,
      color: "bg-orange-100 text-orange-600",
    },
  ];

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
              Monitor messaging efficiency, campaign performance, and channel health
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
            >
              {DATE_FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
            >
              {CHANNEL_FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
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
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load analytics</p>
          <p className="mt-1 text-xs text-rose-700">{error.message}</p>
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
                    <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="mt-2 text-xs text-gray-500">{kpi.description}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.color} transition group-hover:scale-110`}>
                    {kpi.icon}
                  </div>
                </div>
              </div>
            ))}
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
              <div className="space-y-4">
                {analytics?.channelVolume && analytics.channelVolume.length > 0 ? (
                  analytics.channelVolume.map((channel, index) => {
                    const total = (analytics?.channelVolume || []).reduce((sum, c) => sum + c.value, 0);
                    const percentage = total > 0 ? (channel.value / total) * 100 : 0;
                    return (
                      <div key={channel.channel || index} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-900 capitalize">{channel.channel}</span>
                          <span className="text-gray-500">{channel.value} conversations</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100">
                          <div
                            className="h-2.5 rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-gray-500 py-4">No channel data available</p>
                )}
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <RocketIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">
                Campaign performance metrics and engagement rates
              </p>
              <div className="space-y-4">
                {analytics?.campaignPerformance && analytics.campaignPerformance.length > 0 ? (
                  analytics.campaignPerformance.map((campaign) => (
                    <div key={campaign.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{campaign.name}</span>
                        <span className="text-gray-500">Open {campaign.open}% • Click {campaign.click}%</span>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-gray-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          style={{ width: `${campaign.open}%` }}
                          aria-hidden
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70"
                          style={{ width: `${campaign.click}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-500 py-4">No campaign data available yet</p>
                )}
              </div>
            </div>
          </section>

          {/* Response Distribution & Platform Comparison */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Response Distribution Pie */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Response Distribution</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">Breakdown of response types across conversations</p>
              <div className="flex items-center gap-6">
                <div className="relative h-40 w-40 shrink-0">
                  {(() => {
                    const total = (analytics?.responseDistribution || []).reduce((s, b) => s + b.value, 0);
                    let acc = 0;
                    const slices = (analytics?.responseDistribution || []).map((b, i) => {
                      const start = acc / (total || 1);
                      acc += b.value;
                      const end = acc / (total || 1);
                      const colors = ["#635BFF", "#34D399", "#F59E0B", "#EF4444", "#3B82F6"];
                      return `${colors[i % colors.length]} ${start * 360}deg ${end * 360}deg`;
                    });
                    const bg = `conic-gradient(${slices.join(", ") || "#e5e7eb 0deg 360deg"})`;
                    return <div className="h-full w-full rounded-full" style={{ background: bg }} />;
                  })()}
                  <div className="absolute inset-6 rounded-full bg-white" />
                </div>
                <div className="flex-1 space-y-2 text-xs text-gray-600">
                  {(analytics?.responseDistribution || []).map((b, i) => {
                    const colors = ["#635BFF", "#34D399", "#F59E0B", "#EF4444", "#3B82F6"];
                    return (
                      <div key={b.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: colors[i % colors.length] }}
                          />
                          {b.label}
                        </span>
                        <span className="font-semibold text-gray-900">{b.value}%</span>
                      </div>
                    );
                  })}
                  {(analytics?.responseDistribution || []).length === 0 && (
                    <p className="text-center text-gray-400">No response data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Comparison */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUpIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Platform Comparison</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">Conversation volume by platform</p>
              <div className="space-y-3">
                {(analytics?.channelVolume || []).map((c) => (
                  <div key={c.channel}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-900 capitalize">{c.channel}</span>
                      <span className="text-gray-500">{c.value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, c.value)}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                ))}
                {(analytics?.channelVolume || []).length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">No platform data</p>
                )}
              </div>
            </div>
          </section>

          {/* Response Time & Team Leaderboard */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Response Time Distribution */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Response Time Distribution</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">
                Time between inbound messages and first reply
              </p>
              <div className="grid gap-3">
                {analytics?.responseDistribution && analytics.responseDistribution.length > 0 ? (
                  analytics.responseDistribution.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <span className="text-sm text-gray-700">{bucket.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{bucket.value}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-500 py-4">Response time data coming soon</p>
                )}
              </div>
            </div>

            {/* Team Leaderboard */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Team Leaderboard</h2>
              </div>
              <p className="mb-6 text-xs text-gray-500">Top performers on your team</p>
              <div className="space-y-3">
                {analytics?.teamLeaderboard && analytics.teamLeaderboard.length > 0 ? (
                  analytics.teamLeaderboard.map((member, index) => (
                    <div
                      key={member.name}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{member.summary}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                    <UsersIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-xs text-gray-500">
                      Invite teammates in{' '}
                      <Link href="/app/settings/team" className="font-semibold text-primary hover:text-primary/80">
                        Settings → Team
                      </Link>{' '}
                      to unlock leaderboards
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
