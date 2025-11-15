'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAnalytics } from "@/app/(tenant)/hooks/useAnalytics";

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
    // Custom date handling would go here

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

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Analytics & Insights</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Monitor messaging efficiency, campaign performance, and channel health to optimise your automation strategy.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm">
            <span>Date range</span>
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
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm">
            <span>Channel</span>
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
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Failed to load analytics</p>
          <p className="mt-2 text-xs text-rose-700">{error.message}</p>
        </div>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scheduled posts</p>
              <p className="mt-4 text-4xl font-semibold text-gray-900">{analytics?.kpis[0]?.value ?? "0"}</p>
              <p className="mt-3 text-xs text-gray-500">Content queued across all platforms.</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Posted</p>
              <p className="mt-4 text-4xl font-semibold text-gray-900">{analytics?.kpis[1]?.value ?? "0"}</p>
              <p className="mt-3 text-xs text-gray-500">Successfully published content.</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Conversations</p>
              <p className="mt-4 text-4xl font-semibold text-gray-900">{analytics?.kpis[2]?.value ?? "0"}</p>
              <p className="mt-3 text-xs text-gray-500">Active conversations across all channels.</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Interactions</p>
              <p className="mt-4 text-4xl font-semibold text-gray-900">{analytics?.kpis[3]?.value ?? "0"}</p>
              <p className="mt-3 text-xs text-gray-500">Total interactions and engagements.</p>
            </div>
          </section>
        </>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Volume by channel</h2>
          <p className="mt-2 text-xs text-gray-500">
            Percentage distribution of connected channels. Additional data will populate once analytics is live.
          </p>
          <div className="mt-6 space-y-4">
            {analytics?.channelVolume && analytics.channelVolume.length > 0 ? (
              analytics.channelVolume.map((channel, index) => {
                const total = analytics.channelVolume.reduce((sum, c) => sum + c.value, 0);
                const percentage = total > 0 ? (channel.value / total) * 100 : 0;
                return (
                  <div key={channel.channel || index} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold text-gray-900">{channel.channel}</span>
                      <span>{channel.value} conversations</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-gray-500">No channel data available</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Campaign performance</h2>
          <p className="mt-2 text-xs text-gray-500">
            Campaign performance metrics coming soon. Check back for detailed analytics on your broadcasts.
          </p>
          <div className="mt-6 space-y-4">
            {analytics?.campaignPerformance && analytics.campaignPerformance.length > 0 ? (
              analytics.campaignPerformance.map((campaign) => (
                <div key={campaign.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{campaign.name}</span>
                    <span className="text-gray-500">Open {campaign.open}% • Click {campaign.click}%</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gray-100">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${campaign.open}%` }} aria-hidden />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70"
                      style={{ width: `${campaign.click}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500">No campaign data available yet</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Response time distribution</h2>
          <p className="mt-2 text-xs text-gray-500">
            Brancr will track the time between inbound messages and first reply to help your team stay responsive.
          </p>
          <div className="mt-6 grid gap-3 text-xs text-gray-600">
            {analytics?.responseDistribution && analytics.responseDistribution.length > 0 ? (
              analytics.responseDistribution.map((bucket) => (
                <div
                  key={bucket.label}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-neutral-bg px-4 py-3"
                >
                  <span>{bucket.label}</span>
                  <span className="font-semibold text-gray-900">{bucket.value}%</span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500">Response time data coming soon</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Team leaderboard</h2>
          <p className="mt-2 text-xs text-gray-500">Team metrics will surface once multiple agents begin engaging via Brancr.</p>
          <div className="mt-6 flex flex-col items-start gap-3 text-xs text-gray-600">
            {analytics?.teamLeaderboard && analytics.teamLeaderboard.length > 0 ? (
              analytics.teamLeaderboard.map((member) => (
                <div
                  key={member.name}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-neutral-bg px-4 py-3"
                >
                  <span className="font-semibold text-gray-900">{member.name}</span>
                  <span className="text-gray-600">{member.summary}</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                Invite teammates in <Link href="/app/settings/team" className="font-semibold text-primary">Settings → Team</Link> to unlock leaderboards.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

