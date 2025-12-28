'use client';

import Link from "next/link";
import { useState } from "react";
import Select from "@/app/(tenant)/components/ui/Select";

export default function NewCampaignPage() {
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("broadcast");

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Create Campaign</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Set up a new messaging campaign to engage with your audience.
          </p>
        </div>
        <Link
          href="/app/campaigns"
          className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
        >
          ← Back to Campaigns
        </Link>
      </header>

      <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
              Campaign Name
            </label>
            <input
              type="text"
              id="name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer Sale Announcement"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-900">
              Campaign Type
            </label>
            <div className="mt-2">
              <Select
                id="type"
                value={campaignType as 'broadcast' | 'automated' | 'triggered'}
                onChange={(value) => setCampaignType((value || 'broadcast') as any)}
                searchable={false}
                options={[
                  { value: 'broadcast', label: 'Broadcast Message' },
                  { value: 'automated', label: 'Automated Sequence' },
                  { value: 'triggered', label: 'Triggered Campaign' },
                ]}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="text-sm font-semibold text-amber-900">Coming Soon</h3>
            <p className="mt-2 text-sm text-amber-700">
              Campaign creation and automation features are currently in development. You&apos;ll be able to create,
              schedule, and manage campaigns here soon.
            </p>
            <Link
              href="mailto:contact@brancr.com?subject=Campaign%20Feature%20Inquiry"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
            >
              Contact us about campaigns
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed dark:bg-white dark:text-gray-900"
            >
              Create Campaign
            </button>
            <Link
              href="/app/campaigns"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

