'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../providers/TenantProvider";
import { tenantApi } from "@/lib/api";
import { useScheduledPosts } from "@/app/(tenant)/hooks/useScheduledPosts";
import { useIntegrations } from "@/app/(tenant)/hooks/useIntegrations";
import { useConversations } from "@/app/(tenant)/hooks/useConversations";
import { useEscalations } from "@/app/(tenant)/hooks/useEscalations";
import { useMedia } from "@/app/(tenant)/hooks/useMedia";
import {
  RocketIcon,
  UserGroupIcon,
  AlertIcon,
  LinkIcon,
  DocumentTextIcon,
  ClockIcon,
  TrendingUpIcon,
  PlusIcon,
  CalendarIcon,
  InboxIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FireIcon,
  ImageIcon,
} from "../components/icons";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TenantOverviewPage() {
  const { tenant } = useTenant();
  
  // Fetch all dashboard data
  const { data: overviewData } = useQuery({
    queryKey: ["tenant", "overview"],
    queryFn: () => tenantApi.overview(),
  });
  
  const { data: scheduledPostsData } = useScheduledPosts();
  const { data: integrationsData } = useIntegrations();
  const { data: conversationsData } = useConversations({ limit: 10 });
  const { data: escalationsData } = useEscalations({ limit: 5 });
  const { data: mediaData } = useMedia({ limit: 5 });

  // Ensure all data is arrays
  const scheduledPosts = Array.isArray(scheduledPostsData) ? scheduledPostsData : [];
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
  const escalations = escalationsData?.escalations || [];
  const mediaItems = mediaData || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalPosts = scheduledPosts.length;
    const publishedPosts = scheduledPosts.filter((p) => p.status === "posted").length;
    const activeConversations = conversations.length;
    const pendingEscalations = escalations.filter((e) => e.status === "pending").length;
    const connectedPlatforms = integrations.filter((i) => i.connected).length;
    const totalPlatforms = integrations.length || 4;

    return {
      totalPosts,
      publishedPosts,
      activeConversations,
      pendingEscalations,
      connectedPlatforms,
      totalPlatforms,
    };
  }, [scheduledPosts, conversations, escalations, integrations]);

  // Activity feed items
  const activityFeed = useMemo(() => {
    const activities: Array<{
      id: string;
      type: "post" | "conversation" | "escalation" | "media";
      title: string;
      description: string;
      timestamp: Date;
      icon: React.ReactNode;
      href: string;
      color: string;
    }> = [];

    // Recent posts
    scheduledPosts
      .filter((p) => p.status === "posted")
      .sort((a, b) => new Date(b.scheduled_at || b.created_at).getTime() - new Date(a.scheduled_at || a.created_at).getTime())
      .slice(0, 3)
      .forEach((post) => {
        activities.push({
          id: `post-${post.id}`,
          type: "post",
          title: "Post published",
          description: post.name || "Untitled post",
          timestamp: new Date(post.scheduled_at || post.created_at),
          icon: <RocketIcon className="w-4 h-4" />,
          href: `/app/campaigns`,
          color: "text-blue-600 bg-blue-50",
        });
      });

    // Recent conversations
    conversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach((conv) => {
        activities.push({
          id: `conv-${conv.id}`,
          type: "conversation",
          title: "New conversation",
          description: `${conv.contactName} on ${conv.channel}`,
          timestamp: new Date(conv.updatedAt),
          icon: <InboxIcon className="w-4 h-4" />,
          href: `/app/inbox/${conv.id}`,
          color: "text-green-600 bg-green-50",
        });
      });

    // Recent escalations
    escalations
      .filter((e) => e.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach((esc) => {
        activities.push({
          id: `esc-${esc.id}`,
          type: "escalation",
          title: "Escalation received",
          description: `${esc.customerName} - ${esc.intent}`,
          timestamp: new Date(esc.createdAt),
          icon: <AlertIcon className="w-4 h-4" />,
          href: `/app/escalations/${esc.id}`,
          color: "text-orange-600 bg-orange-50",
        });
      });

    // Recent media uploads
    mediaItems
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach((media) => {
        activities.push({
          id: `media-${media.id}`,
          type: "media",
          title: "Media uploaded",
          description: media.name || "New media",
          timestamp: new Date(media.created_at),
          icon: <ImageIcon className="w-4 h-4" />,
          href: `/app/media`,
          color: "text-purple-600 bg-purple-50",
        });
      });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  }, [scheduledPosts, conversations, escalations, mediaItems]);

  // Upcoming posts (next 5)
  const upcomingPosts = useMemo(() => {
    return scheduledPosts
      .filter((p) => p.status === "scheduled" || p.status === "posting")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 5);
  }, [scheduledPosts]);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back{tenant ? `, ${tenant.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Here&apos;s a quick snapshot of your automation, conversations, and campaign health today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/posts/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105"
            >
              <PlusIcon className="w-4 h-4" />
              Create Post
            </Link>
            <Link
              href="/app/integrations"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <LinkIcon className="w-4 h-4" />
              View Integrations
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Posts */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Posts</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
              <p className="mt-1 text-xs text-gray-500">
                {stats.publishedPosts} published
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-200">
              <RocketIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Active Conversations</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeConversations}</p>
              <p className="mt-1 text-xs text-gray-500">In progress</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:bg-green-200">
              <UserGroupIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Escalations */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Pending Escalations</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingEscalations}</p>
              <p className="mt-1 text-xs text-gray-500">Requires attention</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-200">
              <AlertIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Connected Platforms</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.connectedPlatforms}
                {stats.totalPlatforms > 0 && (
                  <span className="ml-1 text-lg font-normal text-gray-500">/{stats.totalPlatforms}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">Platforms syncing</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition group-hover:bg-purple-200">
              <LinkIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Feed */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
                <p className="mt-1 text-xs text-gray-500">Recent posts, conversations, and updates</p>
              </div>
              <Link
                href="/app/inbox"
                className="text-xs font-semibold text-primary hover:text-primary/80 transition"
              >
                View all
                <ArrowRightIcon className="ml-1 inline w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {activityFeed.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">No recent activity</p>
                  <p className="mt-1 text-xs text-gray-500">Activity will appear here as you use the platform</p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", activity.color)}>
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-gray-600">{activity.description}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
                <p className="mt-1 text-xs text-gray-500">Last 7 days overview</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-medium text-gray-500">Engagement Rate</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">--</p>
                <p className="mt-1 text-xs text-gray-500">Coming soon</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <FireIcon className="h-5 w-5 text-orange-600" />
                  <p className="text-xs font-medium text-gray-500">Top Performing Post</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900">--</p>
                <p className="mt-1 text-xs text-gray-500">Analytics coming soon</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-900">💡 Tip</p>
              <p className="mt-1 text-xs text-blue-700">
                Connect more platforms and publish regularly to see detailed performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/app/posts/new"
                className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-[1.02]"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Post</span>
              </Link>
              <Link
                href="/app/calendar"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>View Calendar</span>
              </Link>
              <Link
                href="/app/inbox"
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5"
              >
                <InboxIcon className="w-5 h-5" />
                <span>Check Inbox</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Posts */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Posts</h2>
                <p className="mt-1 text-xs text-gray-500">Next scheduled</p>
              </div>
              <Link
                href="/app/campaigns"
                className="text-xs font-semibold text-primary hover:text-primary/80 transition"
              >
                View all
                <ArrowRightIcon className="ml-1 inline w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingPosts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                  <ClockIcon className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-xs font-medium text-gray-900">No upcoming posts</p>
                  <p className="mt-1 text-xs text-gray-500">Schedule your first post to get started</p>
                </div>
              ) : (
                upcomingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href="/app/campaigns"
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <ClockIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{post.name}</p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {Array.isArray(post.platforms) && post.platforms.length > 0
                          ? post.platforms.join(", ")
                          : "No platforms"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(post.scheduled_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 capitalize">{tenant?.status ?? "active"}</p>
                <p className="text-xs text-gray-500">Workspace is healthy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
