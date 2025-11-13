'use client';

import Link from "next/link";
import { use } from "react";

const mockCampaigns: Record<string, { id: string; title: string; status: string; message: string; sent: number; opened: number; clicked: number; createdAt: string }> = {
  "post-001": {
    id: "post-001",
    title: "Summer Sale Announcement",
    status: "Completed",
    message: "🌞 Summer Sale is here! Get 30% off on all items. Shop now!",
    sent: 1250,
    opened: 987,
    clicked: 456,
    createdAt: "Jul 1, 2025",
  },
  "post-002": {
    id: "post-002",
    title: "New Product Launch",
    status: "Scheduled",
    message: "🚀 Exciting news! Our new product is launching soon. Stay tuned!",
    sent: 0,
    opened: 0,
    clicked: 0,
    createdAt: "Jul 5, 2025",
  },
  "post-003": {
    id: "post-003",
    title: "Weekly Newsletter",
    status: "Draft",
    message: "📰 This week's highlights and updates from our team.",
    sent: 0,
    opened: 0,
    clicked: 0,
    createdAt: "Jul 6, 2025",
  },
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaign = mockCampaigns[id];

  if (!campaign) {
    return (
      <div className="space-y-10">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-12 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Not Found</h1>
          <p className="mt-2 text-sm text-gray-600">
            The campaign you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/app/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Scheduled: "bg-amber-100 text-amber-700 border-amber-200",
    Draft: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">{campaign.title}</h1>
          <p className="mt-2 flex items-center gap-3 text-sm text-gray-600">
            <span>Created on {campaign.createdAt}</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[campaign.status as keyof typeof statusColors]
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {campaign.status}
            </span>
          </p>
        </div>
        <Link
          href="/app/campaigns"
          className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
        >
          ← Back to Campaigns
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Sent</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{campaign.sent.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Opened</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{campaign.opened.toLocaleString()}</p>
          {campaign.sent > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {Math.round((campaign.opened / campaign.sent) * 100)}% open rate
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Clicked</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{campaign.clicked.toLocaleString()}</p>
          {campaign.opened > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {Math.round((campaign.clicked / campaign.opened) * 100)}% click rate
            </p>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Message Content</h2>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm text-gray-900">{campaign.message}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <h3 className="text-sm font-semibold text-amber-900">Campaign Details Preview</h3>
        <p className="mt-2 text-sm text-amber-700">
          This is a preview of campaign details. Full analytics, audience targeting, and campaign editing features are
          coming soon.
        </p>
      </section>
    </div>
  );
}

