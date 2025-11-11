'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCampaigns } from "../../hooks/useCampaigns";

const STATUS_FILTERS = ["All", "Draft", "Scheduled", "Active", "Completed"];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
};

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export default function CampaignsPage() {
  const { data, isLoading, isError, refetch } = useCampaigns();
  const [filter, setFilter] = useState<string>("All");

  const campaigns = useMemo(() => {
    if (!data) return [];
    if (filter === "All") return data;
    return data.filter((campaign) => campaign.status === filter.toLowerCase());
  }, [data, filter]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Automation & Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Orchestrate broadcasts, drip flows, and templates that keep your community engaged across channels.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            Manage templates
          </Link>
          <Link
            href="/app/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            + Build campaign
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Campaigns</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">Pipeline</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filter === item
                    ? "border-primary bg-primary text-white shadow shadow-primary/20"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="h-3 w-32 rounded-full bg-gray-200" />
                  <div className="mt-2 h-3 w-48 rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-sm text-gray-500">
              <p>Unable to load campaigns right now.</p>
              <button
                onClick={() => refetch()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
              >
                Retry
              </button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No campaigns yet. Start by building your first automation.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Campaign</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Channel</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Audience</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Scheduled</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Metrics</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{campaign.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                              STATUS_STYLES[campaign.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{campaign.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        {CHANNEL_LABEL[campaign.channel] ?? campaign.channel}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">{campaign.audience}</td>
                    <td className="px-4 py-4 align-top text-xs text-gray-500">
                      {campaign.scheduledFor
                        ? new Date(campaign.scheduledFor).toLocaleString()
                        : "Draft saved"}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      {campaign.metrics ? (
                        <div className="space-y-1">
                          <p>Sent: {campaign.metrics.sent}</p>
                          <p>Open rate: {campaign.metrics.openRate}%</p>
                          <p>Click rate: {campaign.metrics.clickRate}%</p>
                        </div>
                      ) : (
                        <p className="text-gray-400">Pending launch</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-semibold text-primary">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/app/campaigns/${campaign.id}`} className="hover:text-primary/80">
                          View
                        </Link>
                        <span className="text-gray-300">•</span>
                        <button className="hover:text-primary/80">Duplicate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming calendar</h3>
          <p className="mt-2 text-xs text-gray-500">
            View campaign timing and platform delivery slots. Switch to calendar view for drag-drop scheduling.
          </p>
          <div className="mt-4 grid gap-3 text-xs text-gray-600">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">Instagram Giveaway</p>
              <p className="mt-1 text-gray-500">7 Jul • 14:30</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">WhatsApp Upsell Flow</p>
              <p className="mt-1 text-gray-500">8 Jul • 09:00</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-primary/5 p-3">
              <p className="font-semibold text-gray-900">TikTok Series</p>
              <p className="mt-1 text-gray-500">Draft awaiting approvals</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900">Template library</h3>
          <p className="mt-1 text-xs text-gray-500">
            Store brand-approved copy, call-to-actions, and voice settings for consistent messaging.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">AI Reply • Delivery ETA</p>
              <p className="mt-2 text-xs text-gray-500">
                Provide estimated delivery times with dynamic tokens for order ID and courier updates.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Broadcast • Restock Alert</p>
              <p className="mt-2 text-xs text-gray-500">
                Triggered when inventory refreshes. Includes CTA buttons per channel.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Automation • Abandoned Cart</p>
              <p className="mt-2 text-xs text-gray-500">
                Multi-step flow with personalised incentives. Tracks conversions automatically.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Quick Reply • FAQ</p>
              <p className="mt-2 text-xs text-gray-500">
                One-click answers for shipping, payment, and support questions in the inbox.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm lg:col-span-3 lg:flex lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ideas board</h3>
            <p className="mt-2 text-xs text-gray-500">
              Keep a backlog of campaigns you’d love to test. Drag them into the planner when ready.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 lg:mt-0">
            <span className="rounded-xl border border-gray-200 px-4 py-2">Festive upsell flow</span>
            <span className="rounded-xl border border-gray-200 px-4 py-2">Referral reactivation</span>
            <span className="rounded-xl border border-gray-200 px-4 py-2">VIP loyalty nurture</span>
          </div>
        </div>
      </section>
    </div>
  );
}

