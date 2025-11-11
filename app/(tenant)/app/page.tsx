 'use client';

import { useEffect, useState } from "react";
import { tenantApi } from "@/lib/api";
import { useTenant } from "../providers/TenantProvider";

type OverviewData = {
  conversations: number;
  scheduledPosts: number;
};

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-24 rounded-full bg-gray-200" />
          <div className="mt-4 h-8 w-32 rounded-full bg-gray-200" />
          <div className="mt-4 h-3 w-40 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function TenantOverviewPage() {
  const { tenant } = useTenant();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      setLoading(true);
      setError(null);
      try {
        const result = await tenantApi.overview();
        if (!isMounted) return;
        setData(result);
      } catch (err) {
        if (err instanceof Error && isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back{tenant ? `, ${tenant.name.split(' ')[0]}` : ""}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor conversations, automation and channel health in one clean overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/app/integrations"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            View integrations
          </a>
          <a
            href="/app/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            + New campaign
          </a>
        </div>
      </section>

      {loading && <OverviewSkeleton />}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "We couldn’t load your overview. Please refresh the page."}
        </div>
      ) : null}

      {!loading && data ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Conversations</p>
            <p className="mt-4 text-4xl font-semibold text-gray-900">{data.conversations}</p>
            <p className="mt-2 text-sm text-gray-600">Active threads across all channels</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scheduled posts</p>
            <p className="mt-4 text-4xl font-semibold text-gray-900">{data.scheduledPosts}</p>
            <p className="mt-2 text-sm text-gray-600">Content queued in upcoming campaigns</p>
          </div>
          <div className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Next steps</p>
            <p className="mt-4 text-lg font-semibold text-gray-900">Connect another channel</p>
            <p className="mt-2 text-sm text-gray-600">
              Keep automation in sync by linking Instagram, Facebook or WhatsApp Business.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Need help?</p>
            <p className="mt-4 text-lg font-semibold text-gray-900">Support concierge</p>
            <p className="mt-2 text-sm text-gray-600">
              Chat with our team on WhatsApp or email contact@brancr.com for tailored onboarding.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

