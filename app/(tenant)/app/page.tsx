'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "../providers/TenantProvider";
import { tenantApi } from "@/lib/api";
import { useScheduledPosts, usePerformanceSummary } from "@/app/(tenant)/hooks/useScheduledPosts";
import { useIntegrations } from "@/app/(tenant)/hooks/useIntegrations";
import { useConversations } from "@/app/(tenant)/hooks/useConversations";
import { useEscalations, useEscalationStats } from "@/app/(tenant)/hooks/useEscalations";
import { useMedia } from "@/app/(tenant)/hooks/useMedia";
import { useOrders } from "@/app/(tenant)/hooks/useOrders";
import { usePayments } from "@/app/(tenant)/hooks/usePayments";
import { useProducts } from "@/app/(tenant)/hooks/useProducts";
import { useMenuItems } from "@/app/(tenant)/hooks/useMenuItems";
import { useServices } from "@/app/(tenant)/hooks/useServices";
import { useTenantIndustry } from "@/app/(tenant)/hooks/useIndustry";
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
  PackageIcon,
} from "../components/icons";
import { OrderCard, PaymentCard } from "../components/cards";
import { NotificationsPanel } from "../components/dashboard/NotificationsPanel";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TenantOverviewPage() {
  const { tenant } = useTenant();
  const { data: tenantIndustry } = useTenantIndustry();
  
  // Fetch all dashboard data
  const { data: overviewData } = useQuery({
    queryKey: ["tenant", "overview"],
    queryFn: () => tenantApi.overview(),
  });
  
  const { data: scheduledPostsData } = useScheduledPosts();
  // Fetch upcoming posts separately for the dashboard
  const { data: upcomingPostsData } = useScheduledPosts({ status: "scheduled", limit: 5 });
  // Fetch performance summary
  const { data: performanceSummary } = usePerformanceSummary("7d");
  const { data: integrationsData } = useIntegrations();
  const { data: conversationsData } = useConversations({ limit: 100 }); // Get more for unread count calculation
  const { data: escalationsData } = useEscalations({ limit: 5 });
  const { data: escalationStatsData } = useEscalationStats();
  const { data: mediaData } = useMedia({ limit: 5 });
  const { data: ordersData } = useOrders({ limit: 5 });
  const { data: paymentsData } = usePayments({ limit: 5 });
  
  // Industry-specific data
  const { data: productsData } = useProducts({ limit: 5 });
  const { data: menuItemsData } = useMenuItems({ limit: 5 });
  const { data: servicesData } = useServices({ limit: 5 });
  
  const products = productsData || [];
  const menuItems = menuItemsData || [];
  const services = servicesData || [];

  // Ensure all data is arrays
  const scheduledPosts = Array.isArray(scheduledPostsData) ? scheduledPostsData : [];
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
  const escalations = escalationsData?.escalations || [];
  const mediaItems = mediaData || [];
  const orders = ordersData?.orders || [];
  const payments = paymentsData?.payments || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalPosts = scheduledPosts.length;
    const publishedPosts = scheduledPosts.filter((p) => p.status === "posted").length;
    const activeConversations = conversations.length;
    // Use escalation stats if available, otherwise count all escalations as pending
    const pendingEscalations = escalationStatsData?.pending ?? escalations.length;
    const connectedPlatforms = integrations.filter((i) => i.connected).length;
    const totalPlatforms = integrations.length || 4;
    // Calculate unread messages
    const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

    return {
      totalPosts,
      publishedPosts,
      activeConversations,
      pendingEscalations,
      connectedPlatforms,
      totalPlatforms,
      unreadMessages,
    };
  }, [scheduledPosts, conversations, escalations, integrations, escalationStatsData]);

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
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .forEach((conv) => {
        activities.push({
          id: `conv-${conv.id}`,
          type: "conversation",
          title: "New conversation",
          description: `${conv.customer_name} on ${conv.platform}`,
          timestamp: new Date(conv.updated_at),
          icon: <InboxIcon className="w-4 h-4" />,
          href: `/app/inbox?conversation=${conv.id}`,
          color: "text-green-600 bg-green-50",
        });
      });

    // Recent escalations (all escalations are considered pending by default)
    escalations
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

  // Upcoming posts (from API, already filtered and limited)
  const upcomingPosts = useMemo(() => {
    const posts = Array.isArray(upcomingPostsData) ? upcomingPostsData : [];
    // Sort by scheduled_at ascending (next posts first)
    return posts.sort((a, b) => {
      const aTime = a.scheduled_at || "";
      const bTime = b.scheduled_at || "";
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
  }, [upcomingPostsData]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              {(() => {
                const displayName = (tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || "");
                const firstWord = displayName.split(/\s+/).filter(Boolean)[0];
                return `Welcome back${firstWord ? ", " + firstWord : ""}`;
              })()}
            </h1>
            <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
              Here&apos;s a quick snapshot of your automation, conversations, and campaign health today.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/app/posts/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:shadow-md"
            >
              <PlusIcon className="w-4 h-4" />
              Create Post
            </Link>
            <Link
              href="/app/integrations"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
            >
              <LinkIcon className="w-4 h-4" />
              View Integrations
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel
        unreadMessages={stats.unreadMessages}
        pendingEscalations={stats.pendingEscalations}
        recentConversations={conversations
          .filter((c) => (c.unread_count || 0) > 0)
          .slice(0, 3)
          .map((c) => ({
            id: Number(c.id),
            customer_name: c.customer_name || 'Unknown',
            platform: c.platform || 'unknown',
            unread_count: c.unread_count || 0,
            last_message_at: c.last_message_at || c.created_at,
          }))}
        recentEscalations={escalations.slice(0, 3).map((e) => ({
          id: e.id,
          customerName: e.customerName || 'Unknown',
          platform: e.platform || 'unknown',
          message: e.message || '',
          priority: e.priority || 'normal',
          createdAt: e.createdAt,
        }))}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Total Posts */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-blue-50 transition-transform group-hover:scale-150 sm:h-20 sm:w-20 sm:-translate-y-6 sm:translate-x-6" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Posts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalPosts}</p>
              <p className="mt-1 text-xs text-gray-500">
                {stats.publishedPosts} published
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-200 sm:h-12 sm:w-12">
              <RocketIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-green-50 transition-transform group-hover:scale-150 sm:h-20 sm:w-20 sm:-translate-y-6 sm:translate-x-6" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Conversations</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{stats.activeConversations}</p>
              <p className="mt-1 text-xs text-gray-500">In progress</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:bg-green-200 sm:h-12 sm:w-12">
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Pending Escalations */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-orange-50 transition-transform group-hover:scale-150 sm:h-20 sm:w-20 sm:-translate-y-6 sm:translate-x-6" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Escalations</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{stats.pendingEscalations}</p>
              <p className="mt-1 text-xs text-gray-500">Requires attention</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-200 sm:h-12 sm:w-12">
              <AlertIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-purple-50 transition-transform group-hover:scale-150 sm:h-20 sm:w-20 sm:-translate-y-6 sm:translate-x-6" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Connected Platforms</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                {stats.connectedPlatforms}
                {stats.totalPlatforms > 0 && (
                  <span className="ml-1 text-base font-normal text-gray-500 sm:text-lg">/{stats.totalPlatforms}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">Platforms syncing</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition group-hover:bg-purple-200 sm:h-12 sm:w-12">
              <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders & Payments Stats */}
      {(orders.length > 0 || payments.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Recent Orders</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Latest orders</p>
                </div>
                <Link
                  href="/app/orders"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition"
                >
                  View all
                  <ArrowRightIcon className="ml-1 h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 3).map((order) => (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    order_number={order.order_number}
                    status={order.status}
                    total_amount={order.total_amount}
                    currency={order.currency}
                    created_at={order.created_at}
                    items_count={order.items.length}
                    payment_reference={order.payment_reference}
                    isAutoCreated={order.is_auto_created}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Recent Payments</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Latest payments</p>
                </div>
                <Link
                  href="/app/payments"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition"
                >
                  View all
                  <ArrowRightIcon className="ml-1 h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {payments.slice(0, 3).map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    id={payment.id}
                    amount={payment.amount}
                    currency={payment.currency}
                    status={payment.status === 'verified' || payment.status === 'confirmed' ? 'verified' : payment.status === 'pending' ? 'pending' : payment.status === 'disputed' ? 'disputed' : 'failed'}
                    payment_method={payment.payment_method}
                    payment_reference={payment.payment_reference}
                    created_at={payment.created_at}
                    order_id={payment.order_id}
                    order_number={payment.order_number}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column: Activity Feed */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Activity Feed */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Activity Feed</h2>
                <p className="mt-0.5 text-xs text-gray-500">Recent posts, conversations, and updates</p>
              </div>
              <Link
                href="/app/inbox"
                className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition"
              >
                View all
                <ArrowRightIcon className="ml-1 h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {activityFeed.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
                  <ClockIcon className="mx-auto h-6 w-6 text-gray-400 sm:h-8 sm:w-8" />
                  <p className="mt-2 text-sm font-medium text-gray-900">No recent activity</p>
                  <p className="mt-1 text-xs text-gray-500">Activity will appear here as you use the platform</p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] sm:p-4"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", activity.color)}>
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-gray-600 line-clamp-1">{activity.description}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Performance Summary</h2>
              <p className="mt-0.5 text-xs text-gray-500">Last 7 days overview</p>
            </div>
            {!performanceSummary || performanceSummary.total_posts === 0 ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
                      <p className="text-xs font-semibold text-gray-500">Engagement Rate</p>
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">--</p>
                    <p className="mt-1 text-xs text-gray-500">Coming soon</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-4 w-4 shrink-0 text-orange-600 sm:h-5 sm:w-5" />
                      <p className="text-xs font-semibold text-gray-500">Top Performing Post</p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">--</p>
                    <p className="mt-1 text-xs text-gray-500">Analytics coming soon</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:mt-4 sm:p-4">
                  <p className="text-xs font-semibold text-blue-900">💡 Tip</p>
                  <p className="mt-1 text-xs text-blue-700">
                    Connect more platforms and publish regularly to see detailed performance metrics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
                      <p className="text-xs font-semibold text-gray-500">Engagement Rate</p>
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                      {performanceSummary.engagement_rate !== null
                        ? `${performanceSummary.engagement_rate.toFixed(1)}%`
                        : "--"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {performanceSummary.total_posts} posts
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-4 w-4 shrink-0 text-orange-600 sm:h-5 sm:w-5" />
                      <p className="text-xs font-semibold text-gray-500">Top Performing Post</p>
                    </div>
                    {performanceSummary.top_performing_post ? (
                      <>
                        <p className="mt-2 text-sm font-semibold text-gray-900 truncate">
                          {performanceSummary.top_performing_post.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {performanceSummary.top_performing_post.impressions.toLocaleString()} impressions • {performanceSummary.top_performing_post.engagement_rate.toFixed(1)}% engagement
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-sm font-semibold text-gray-900">--</p>
                        <p className="mt-1 text-xs text-gray-500">No data available</p>
                      </>
                    )}
                  </div>
                </div>
                {performanceSummary.total_impressions > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <p className="text-gray-500">Impressions</p>
                      <p className="mt-1 font-semibold text-gray-900">{performanceSummary.total_impressions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <p className="text-gray-500">Reach</p>
                      <p className="mt-1 font-semibold text-gray-900">{performanceSummary.total_reach.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <p className="text-gray-500">Likes</p>
                      <p className="mt-1 font-semibold text-gray-900">{performanceSummary.total_likes.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <p className="text-gray-500">Comments</p>
                      <p className="mt-1 font-semibold text-gray-900">{performanceSummary.total_comments.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Upcoming */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4 sm:text-lg">Quick Actions</h2>
            <div className="space-y-2">
              {/* Industry-specific actions */}
              {tenantIndustry?.capabilities.has_products && (
                <Link
                  href="/app/products"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 sm:justify-start"
                >
                  <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Product</span>
                </Link>
              )}
              {tenantIndustry?.capabilities.has_menu && (
                <Link
                  href="/app/menu-items"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 sm:justify-start"
                >
                  <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Menu Item</span>
                </Link>
              )}
              {tenantIndustry?.capabilities.has_services && (
                <Link
                  href="/app/services"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 sm:justify-start"
                >
                  <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Service</span>
                </Link>
              )}
              
              {/* General actions */}
              <Link
                href="/app/posts/new"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:justify-start sm:shadow-md"
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Post</span>
              </Link>
              <Link
                href="/app/calendar"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 sm:justify-start"
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>View Calendar</span>
              </Link>
              <Link
                href="/app/inbox"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 sm:justify-start"
              >
                <InboxIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Check Inbox</span>
              </Link>
            </div>
          </div>

          {/* Recent Items - Industry Specific */}
          {(tenantIndustry?.capabilities.has_products || tenantIndustry?.capabilities.has_menu || tenantIndustry?.capabilities.has_services) && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Recent Items</h2>
              </div>
              <div className="space-y-2">
                {tenantIndustry?.capabilities.has_products && products.length > 0 && (
                  <div>
                    <Link
                      href="/app/products"
                      className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-primary transition"
                    >
                      <span>Recent Products</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                    <div className="space-y-1.5">
                      {products.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          href="/app/products"
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <PackageIcon className="h-4 w-4 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {product.currency} {product.price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {tenantIndustry?.capabilities.has_menu && menuItems.length > 0 && (
                  <div className={products.length > 0 ? "mt-4" : ""}>
                    <Link
                      href="/app/menu-items"
                      className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-primary transition"
                    >
                      <span>Recent Menu Items</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                    <div className="space-y-1.5">
                      {menuItems.slice(0, 3).map((item) => (
                        <Link
                          key={item.id}
                          href="/app/menu-items"
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <PackageIcon className="h-4 w-4 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {item.currency} {item.price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {tenantIndustry?.capabilities.has_services && services.length > 0 && (
                  <div className={(products.length > 0 || menuItems.length > 0) ? "mt-4" : ""}>
                    <Link
                      href="/app/services"
                      className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-primary transition"
                    >
                      <span>Recent Services</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                    <div className="space-y-1.5">
                      {services.slice(0, 3).map((service) => (
                        <Link
                          key={service.id}
                          href="/app/services"
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <PackageIcon className="h-4 w-4 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{service.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {service.pricing.type === 'hourly' && service.pricing.rate
                                ? `₦${service.pricing.rate}/hr`
                                : service.pricing.type === 'fixed'
                                ? 'Fixed Price'
                                : 'Package-based'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {(products.length === 0 && menuItems.length === 0 && services.length === 0) && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                    <PackageIcon className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="mt-2 text-xs font-medium text-gray-900">No items yet</p>
                    <p className="mt-1 text-xs text-gray-500">Add your first item to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Posts */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Upcoming Posts</h2>
                <p className="mt-0.5 text-xs text-gray-500">Next scheduled</p>
              </div>
              <Link
                href="/app/campaigns"
                className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition"
              >
                View all
                <ArrowRightIcon className="ml-1 h-3 w-3" />
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
                      {post.scheduled_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          {post.scheduled_at && new Date(post.scheduled_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
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
