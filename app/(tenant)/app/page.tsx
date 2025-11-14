'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../providers/TenantProvider";
import { authApi, tenantApi, ApiError } from "@/lib/api";
import { useScheduledPosts } from "@/app/(tenant)/hooks/useScheduledPosts";
import { useIntegrations } from "@/app/(tenant)/hooks/useIntegrations";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TenantOverviewPage() {
  const { tenant } = useTenant();
  const { data: userData } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
  });
  const { data: overviewData } = useQuery({
    queryKey: ["tenant", "overview"],
    queryFn: () => tenantApi.overview(),
  });
  const { data: scheduledPosts = [] } = useScheduledPosts();
  const { data: integrations = [] } = useIntegrations();

  const stats = useMemo(() => {
    const upcomingPosts = scheduledPosts.filter(
      (post) => post.status === "scheduled" || post.status === "posting"
    );
    const connectedChannels = integrations.filter((integration) => integration.connected);
    
    // Get stats from API or fallback to computed values
    const scheduledPostsCount = userData?.scheduled_posts?.total ?? upcomingPosts.length;
    const connectedChannelsCount = userData?.integrations?.connected ?? connectedChannels.length;
    const totalChannels = userData?.integrations?.total ?? integrations.length;

    return {
      scheduledPosts: scheduledPostsCount,
      connectedChannels: connectedChannelsCount,
      totalChannels,
      conversations: overviewData?.conversations ?? 0,
      reminders: [
        upcomingPosts.length > 0
          ? `You have ${upcomingPosts.length} scheduled ${upcomingPosts.length > 1 ? "posts" : "post"} queued this week.`
          : "Create a scheduled post to keep your channels active.",
        connectedChannelsCount < totalChannels
          ? "Connect your remaining channels to unlock automation across every platform."
          : "All supported channels are connected and syncing.",
        "Monitor your integrations to ensure they stay active and syncing.",
      ],
    };
  }, [scheduledPosts, integrations, userData, overviewData]);

  const todayFocus = useMemo(() => {
    const soon = scheduledPosts
      .filter((post) => post.status === "scheduled" || post.status === "posting")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 2)
      .map((post) => ({
        id: post.id,
        text: `Confirm assets for ${post.name} (${post.platforms.join(", ")}) scheduled ${new Date(
          post.scheduled_at
        ).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`,
      }));

    const disconnectedIntegrations = integrations.filter((i) => !i.connected);
    if (disconnectedIntegrations.length > 0) {
      soon.push({
        id: "connect",
        text: `Connect ${disconnectedIntegrations[0].platform} to unlock automation.`,
      });
    }

    return soon;
  }, [scheduledPosts, integrations]);

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
              {todayFocus.map((item, index) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      index === 0 ? "bg-primary" : index === 1 ? "bg-emerald-500" : "bg-sky-500"
                    )}
                    aria-hidden
                  />
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 capitalize">{tenant?.status ?? "active"}</p>
              <p className="mt-1 text-xs text-gray-500">Your workspace is healthy and ready for automation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scheduled posts</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{stats.scheduledPosts}</p>
          <p className="mt-3 text-sm text-gray-500">Content queued to keep your audience engaged this week.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Connected channels</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">
            {stats.connectedChannels}{stats.totalChannels > 0 && `/${stats.totalChannels}`}
          </p>
          <p className="mt-3 text-sm text-gray-500">Platforms actively syncing conversations with Brancr.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Conversations</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{stats.conversations}</p>
          <p className="mt-3 text-sm text-gray-500">Active conversations across all connected channels.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">AI optimization</p>
          <p className="mt-4 text-lg font-semibold text-gray-900">Coming soon</p>
          <p className="mt-3 text-sm text-gray-500">
            Stay tuned for AI performance summaries once analytics is live. In the meantime, use the Telegram assistant for
            caption suggestions.
          </p>
        </div>
      </section>

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

