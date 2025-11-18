'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../providers/TenantProvider";
import { authApi, tenantApi, ApiError } from "@/lib/api";
import { useScheduledPosts } from "@/app/(tenant)/hooks/useScheduledPosts";
import { useIntegrations } from "@/app/(tenant)/hooks/useIntegrations";
import { useConversations } from "@/app/(tenant)/hooks/useConversations";
import { useCalendar } from "@/app/(tenant)/hooks/useCalendar";

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
  const { data: scheduledPostsData } = useScheduledPosts();
  const { data: integrationsData } = useIntegrations();
  const { data: conversationsData } = useConversations({ limit: 5 });
  
  // Get calendar entries for upcoming posts (next 30 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today.toISOString();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: calendarEntriesData } = useCalendar({ start_date: startDate, end_date: endDate });

  // Ensure all data is arrays to prevent filter errors
  const scheduledPosts = Array.isArray(scheduledPostsData) ? scheduledPostsData : [];
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
  const calendarEntries = Array.isArray(calendarEntriesData) ? calendarEntriesData : [];

  const stats = useMemo(() => {
    const upcomingPosts = scheduledPosts.filter(
      (post) => post.status === "scheduled" || post.status === "posting"
    );
    const connectedChannels = integrations.filter((integration) => integration.connected);
    const whatsappConnected = integrations.some((i) => i.platform === "whatsapp" && i.connected);
    
    // Get stats from API or fallback to computed values
    const scheduledPostsCount = userData?.scheduled_posts?.total ?? upcomingPosts.length;
    const connectedChannelsCount = userData?.integrations?.connected ?? connectedChannels.length;
    const totalChannels = userData?.integrations?.total ?? integrations.length;

    return {
      scheduledPosts: scheduledPostsCount,
      connectedChannels: connectedChannelsCount,
      totalChannels,
      conversations: overviewData?.conversations ?? 0,
      whatsappConnected,
      reminders: [
        upcomingPosts.length > 0
          ? `You have ${upcomingPosts.length} scheduled ${upcomingPosts.length > 1 ? "posts" : "post"} queued this week.`
          : "Create a scheduled post to keep your channels active.",
        !whatsappConnected
          ? "Select or add your WhatsApp number to start messaging automation."
          : connectedChannelsCount < totalChannels
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
        text: `Confirm assets for ${post.name} (${Array.isArray(post.platforms) ? post.platforms.join(", ") : "No platforms"}) scheduled ${new Date(
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

  const upcoming = useMemo(() => {
    // Use calendar entries for upcoming posts, fallback to scheduled posts if calendar is empty
    if (calendarEntries.length > 0) {
      return calendarEntries
        .filter((entry) => entry.status === "scheduled" || entry.status === "posting")
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
          const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
          return dateA - dateB;
        })
        .slice(0, 5)
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          platforms: Array.isArray(entry.platforms) ? entry.platforms : [],
          scheduled_at: `${entry.date}T${entry.time || '00:00:00'}`,
        }));
    }
    // Fallback to scheduled posts
    return scheduledPosts
      .filter((post) => post.status === "scheduled" || post.status === "posting")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 5);
  }, [calendarEntries, scheduledPosts]);

  const recentConversations = useMemo(() => {
    // Conversations already limited to 5 by the API call, just sort by most recent
    return (conversations ?? [])
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations]);

  return (
    <div className="space-y-6 text-gray-900">
      {/* Welcome Header Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back{tenant ? `, ${tenant.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Here&apos;s a quick snapshot of your automation, conversations, and campaign health today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/app/integrations"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
            >
              View integrations
            </Link>
            <Link
              href="/app/campaigns"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-accent hover:text-accent"
            >
              Plan campaign
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled posts</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.scheduledPosts}</p>
          <p className="mt-2 text-xs text-gray-500">Content queued this week</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Connected channels</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.connectedChannels}{stats.totalChannels > 0 && `/${stats.totalChannels}`}
          </p>
          <p className="mt-2 text-xs text-gray-500">Platforms syncing</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.conversations}</p>
          <p className="mt-2 text-xs text-gray-500">Active conversations</p>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 shadow-sm">
          <p className="text-xs font-medium text-accent uppercase tracking-wide">AI optimization</p>
          <p className="mt-2 text-lg font-bold text-gray-900">Coming soon</p>
          <p className="mt-2 text-xs text-gray-500">Performance summaries</p>
        </div>
      </section>

      {/* Main Content - Column Layout */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Upcoming Posts */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Upcoming posts</h2>
              <p className="mt-1 text-xs text-gray-500">Planner</p>
            </div>
            <Link href="/app/campaigns" className="text-xs font-semibold text-accent hover:text-accent/80">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                No upcoming posts
              </div>
            ) : (
              upcoming.map((post) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{post.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{Array.isArray(post.platforms) ? post.platforms.join(", ") : "No platforms"}</p>
                  </div>
                  <div className="ml-3 text-right text-xs text-gray-500 whitespace-nowrap">
                    {new Date(post.scheduled_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Recent Conversations */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent conversations</h2>
              <p className="mt-1 text-xs text-gray-500">Timeline</p>
            </div>
            <Link href="/app/inbox" className="text-xs font-semibold text-accent hover:text-accent/80">
              Open inbox →
            </Link>
          </div>
          <div className="space-y-2">
            {recentConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                No recent conversations
              </div>
            ) : (
              recentConversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{c.contactName}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{c.preview || "New message"}</p>
                  </div>
                  <span className="ml-3 rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                    {c.channel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Quick Actions & Status */}
        <div className="space-y-4">
          {/* Today's Focus */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Today&apos;s focus</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              {todayFocus.map((item, index) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full shrink-0",
                      index === 0 ? "bg-accent" : index === 1 ? "bg-emerald-500" : "bg-sky-500"
                    )}
                    aria-hidden
                  />
                  <span className="text-xs">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{tenant?.status ?? "active"}</p>
            <p className="mt-1 text-xs text-gray-500">Workspace is healthy</p>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Link
                href="/app/campaigns/new"
                className="block w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white text-center transition hover:bg-accent/90"
              >
                Create campaign
              </Link>
              <Link
                href="/app/integrations"
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 text-center transition hover:border-accent hover:text-accent"
              >
                Connect channel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

