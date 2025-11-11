'use client';

import { useState } from "react";
import Link from "next/link";
import { mockAnalyticsSummary, mockResponseDistribution, mockScheduledPosts, mockChannels } from "../../data/mockData";

const DATE_FILTERS = ["Last 7 days", "Last 30 days", "Quarter to date", "Custom"];
const CHANNEL_FILTERS = ["All channels", "WhatsApp", "Instagram", "Facebook", "TikTok"];

const placeholderCampaigns = [
  { name: "Welcome Flow", open: 74, click: 28 },
  { name: "VIP Restock Alert", open: 68, click: 34 },
  { name: "Instagram Giveaway", open: 56, click: 22 },
];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS[1]);
  const [channelFilter, setChannelFilter] = useState(CHANNEL_FILTERS[0]);

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

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scheduled posts</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{mockAnalyticsSummary.scheduledPosts}</p>
          <p className="mt-3 text-xs text-gray-500">Content queued across WhatsApp and Instagram.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Connected channels</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{mockAnalyticsSummary.connectedChannels}</p>
          <p className="mt-3 text-xs text-gray-500">Platforms actively syncing conversations.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">AI captions</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{mockAnalyticsSummary.aiCaptionsGenerated}</p>
          <p className="mt-3 text-xs text-gray-500">Generated via Telegram assistant this month.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Coming soon</p>
          <p className="mt-4 text-lg font-semibold text-gray-900">Full analytics dashboard</p>
          <p className="mt-3 text-xs text-gray-500">
            We’re building deeper insights for AI adoption, response time and campaign CTR. For now, check the Telegram daily
            digest for performance highlights.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Volume by channel</h2>
          <p className="mt-2 text-xs text-gray-500">
            Percentage distribution of connected channels. Additional data will populate once analytics is live.
          </p>
          <div className="mt-6 space-y-4">
            {mockChannels.map((channel) => (
              <div key={channel.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{channel.name}</span>
                  <span>{channel.status === "connected" ? "Active" : channel.status === "pending" ? "Pending" : "Awaiting"}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      channel.status === "connected" ? "bg-primary" : channel.status === "pending" ? "bg-amber-400" : "bg-gray-300"
                    }`}
                    style={{ width: channel.status === "connected" ? "100%" : channel.status === "pending" ? "45%" : "20%" }}
                    aria-hidden
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Campaign performance</h2>
          <p className="mt-2 text-xs text-gray-500">
            Sample benchmarks from recent broadcasts. Real metrics will appear once analytics aggregation ships.
          </p>
          <div className="mt-6 space-y-4">
            {placeholderCampaigns.map((campaign) => (
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
            ))}
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
            {mockResponseDistribution.map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-neutral-bg px-4 py-3"
              >
                <span>{bucket.label}</span>
                <span className="font-semibold text-gray-900">{bucket.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Team leaderboard</h2>
          <p className="mt-2 text-xs text-gray-500">Team metrics will surface once multiple agents begin engaging via Brancr.</p>
          <div className="mt-6 flex flex-col items-start gap-3 text-xs text-gray-600">
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
              Invite teammates in <Link href="/app/settings/team" className="font-semibold text-primary">Settings → Team</Link> to unlock leaderboards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

