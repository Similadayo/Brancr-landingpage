'use client';

import { useState } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";

const DATE_FILTERS = ["Last 7 days", "Last 30 days", "Quarter to date", "Custom"];
const CHANNEL_FILTERS = ["All channels", "WhatsApp", "Instagram", "Facebook", "TikTok"];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS[1]);
  const [channelFilter, setChannelFilter] = useState(CHANNEL_FILTERS[0]);
  const analyticsQuery = useAnalytics({
    range: dateFilter.toLowerCase().replace(/\s+/g, "-"),
    channel: channelFilter === "All channels" ? "" : channelFilter.toLowerCase(),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Analytics & Insights</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor messaging efficiency, campaign performance, and channel health to optimise your automation strategy.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">
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
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">
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

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {analyticsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
                <div className="h-3 w-24 rounded-full bg-gray-200" />
                <div className="mt-4 h-6 w-32 rounded-full bg-gray-200" />
              </div>
            ))
          : analyticsQuery.data?.kpis.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{metric.label}</p>
                <p className="mt-4 text-4xl font-semibold text-gray-900">{metric.value}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-600">{metric.delta}</p>
              </div>
            ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Volume by channel</h2>
          <p className="mt-2 text-xs text-gray-500">
            Percentage distribution of incoming conversations across connected platforms.
          </p>
          <div className="mt-6 space-y-4">
            {analyticsQuery.data?.channelVolume.map((item) => (
              <div key={item.channel} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{item.channel}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${item.value}%` }} aria-hidden />
                </div>
              </div>
            )) ?? (
              <p className="text-xs text-gray-500">No data yet for this range.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Campaign performance</h2>
          <p className="mt-2 text-xs text-gray-500">
            Compare open and click rates for recent broadcasts and automations.
          </p>
          <div className="mt-6 space-y-4">
            {analyticsQuery.data?.campaignPerformance.map((campaign) => (
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
            )) ?? (
              <p className="text-xs text-gray-500">No campaign performance yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Response time distribution</h2>
          <p className="mt-2 text-xs text-gray-500">
            Brancr tracks the time between inbound messages and first reply to help your team stay responsive.
          </p>
          <div className="mt-6 grid gap-3 text-xs text-gray-600">
            {analyticsQuery.data?.responseDistribution.map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-neutral-bg px-4 py-3"
              >
                <span>{bucket.label}</span>
                <span className="font-semibold text-gray-900">{bucket.value}%</span>
              </div>
            )) ?? (
              <p className="text-xs text-gray-500">No response time data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Team leaderboard</h2>
          <p className="mt-2 text-xs text-gray-500">See which agents are handling the most conversations and maintaining quality.</p>
          <div className="mt-6 space-y-3 text-xs text-gray-600">
            {analyticsQuery.data?.teamLeaderboard.map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <span className="font-semibold text-gray-900">{member.name}</span>
                <span>{member.summary}</span>
              </div>
            )) ?? (
              <p className="text-xs text-gray-500">Team metrics will appear once agents engage in conversations.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

