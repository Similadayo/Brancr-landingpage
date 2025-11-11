'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tenantApi } from "@/lib/api";
import { useTenant } from "../providers/TenantProvider";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type OverviewData = {
  conversations: number;
  scheduledPosts: number;
};

function OverviewSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur">
          <div className="h-3 w-20 rounded-full bg-gray-200" />
          <div className="mt-4 h-9 w-32 rounded-full bg-gray-200" />
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

  const metrics = useMemo(
    () => [
      {
        label: "Conversations",
        value: data?.conversations ?? 0,
        description: "Active threads across all channels. Stay close to engaged customers.",
      },
      {
        label: "Scheduled posts",
        value: data?.scheduledPosts ?? 0,
        description: "Content queued to keep your audience engaged all week.",
      },
      {
        label: "Workflow health",
        value: tenant?.status === "trial" ? "Trial" : tenant?.status ?? "Active",
        description: "Workspace status for automation and live channel monitoring.",
        accent: true,
      },
    ],
    [data?.conversations, data?.scheduledPosts, tenant?.status]
  );

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg shadow-primary/5">
        <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.3fr_1fr] md:px-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Brancr HQ
            </span>
            <h1 className="mt-6 text-3xl font-semibold text-gray-900 md:text-4xl">
              Welcome back{tenant ? `, ${tenant.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-600">
              Here’s a quick snapshot of your automation, conversations, and campaign health today. Hop into the inbox,
              launch a campaign, or connect another channel in a click.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app/integrations"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              >
                View integrations <span aria-hidden>↗</span>
              </Link>
              <Link
                href="/app/campaigns"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Plan campaign
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-6 shadow-inner">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Today’s focus</p>
            <ul className="mt-6 space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                Respond to any waiting WhatsApp leads under five minutes to keep conversions high.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                Schedule the weekend broadcast to stay top of mind with loyal buyers.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden />
                Invite teammates so you can assign conversations and collaborate in real time.
              </li>
            </ul>
            <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 capitalize">{tenant?.status ?? "active"}</p>
              <p className="mt-1 text-xs text-gray-500">Your workspace is healthy and ready for automation.</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error || "We couldn’t load your overview. Please refresh and try again."}
        </div>
      ) : null}

      {loading ? (
        <OverviewSkeleton />
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
                metric.accent && "border-primary/30 bg-primary/5"
              )}
            >
              <p
                className={cn(
                  "text-xs uppercase tracking-[0.3em]",
                  metric.accent ? "text-primary" : "text-gray-400"
                )}
              >
                {metric.label}
              </p>
              <p className="mt-4 text-4xl font-semibold text-gray-900">
                {typeof metric.value === "number" ? metric.value : metric.value}
              </p>
              <p className="mt-3 text-sm text-gray-500">{metric.description}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md shadow-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Automation pulse</p>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">Recent conversations</h2>
            </div>
            <Link
              href="/app/inbox"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
            >
              Open inbox <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">WhatsApp</p>
              <p className="mt-3 text-sm text-gray-600">
                Keep first response time under five minutes to maintain conversion rates above 40%.
              </p>
              <Link
                href="/app/inbox"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500"
              >
                View threads <span aria-hidden>↗</span>
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-600">Instagram</p>
              <p className="mt-3 text-sm text-gray-600">
                Save replies and template answers to keep influencer requests organised.
              </p>
              <Link
                href="/app/inbox"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-500"
              >
                Manage replies <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Team activity</p>
            <p className="mt-3 text-sm text-gray-600">
              Invite teammates to share channels, assign conversations, and collaborate on automations.
            </p>
            <Link
              href="/app/settings/team"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Invite teammate <span aria-hidden>+</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Need help?</p>
            <p className="mt-3 text-sm text-gray-600">
              Need onboarding or launch support? Chat with us on WhatsApp or email contact@brancr.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

