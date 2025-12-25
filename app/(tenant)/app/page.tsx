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
          color: "text-info-600 bg-info-50 dark:text-info-400 dark:bg-info-900/30",
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
          color: "text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/30",
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
          color: "text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/30",
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
          color: "text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-900/30",
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

  const displayName = useMemo(() => {
    return tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || "";
  }, [tenant]);

  const firstWord = displayName.split(/\s+/).filter(Boolean)[0];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                Welcome back{firstWord ? `, ${firstWord}` : ""}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                Here&apos;s a quick snapshot of your automation, conversations, and campaign health today.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/app/posts/new" className="btn-primary w-full sm:w-auto justify-center">
                <PlusIcon className="w-4 h-4" />
                Create Post
              </Link>
              <Link href="/app/integrations" className="btn-secondary w-full sm:w-auto justify-center">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Posts */}
        <div className="stat-card group">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-info-400/20 to-info-500/20 blur-2xl transition-transform group-hover:scale-150" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Posts</p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPosts}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {stats.publishedPosts} published
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-100 text-info-600 transition-all duration-200 group-hover:bg-info-200 dark:bg-info-900/30 dark:text-info-400">
              <RocketIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="stat-card group">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-success-400/20 to-success-500/20 blur-2xl transition-transform group-hover:scale-150" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active Conversations</p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activeConversations}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">In progress</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-100 text-success-600 transition-all duration-200 group-hover:bg-success-200 dark:bg-success-900/30 dark:text-success-400">
              <UserGroupIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Escalations */}
        <div className="stat-card group">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-warning-400/20 to-warning-500/20 blur-2xl transition-transform group-hover:scale-150" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending Escalations</p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingEscalations}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Requires attention</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-600 transition-all duration-200 group-hover:bg-warning-200 dark:bg-warning-900/30 dark:text-warning-400">
              <AlertIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="stat-card group">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br from-accent-400/20 to-accent-500/20 blur-2xl transition-transform group-hover:scale-150" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Connected Platforms</p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.connectedPlatforms}
                {stats.totalPlatforms > 0 && (
                  <span className="ml-2 text-lg font-normal text-gray-500 dark:text-gray-400">/{stats.totalPlatforms}</span>
                )}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Platforms syncing</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 transition-all duration-200 group-hover:bg-accent-200 dark:bg-accent-900/30 dark:text-accent-400">
              <LinkIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders & Payments Stats */}
      {(orders.length > 0 || payments.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Orders</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest orders</p>
                </div>
                <Link
                  href="/app/orders"
                  className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  View all
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
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
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Payments</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest payments</p>
                </div>
                <Link
                  href="/app/payments"
                  className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  View all
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Feed */}
          <div className="card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Activity Feed</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Recent posts, conversations, and updates</p>
              </div>
              <Link
                href="/app/inbox"
                className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                View all
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {activityFeed.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
                  <ClockIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <p className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">No recent activity</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Activity will appear here as you use the platform</p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-accent/30 hover:shadow-soft active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", activity.color)}>
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{activity.title}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{activity.description}</p>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Performance Summary</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Last 7 days overview</p>
            </div>
            {!performanceSummary || performanceSummary.total_posts === 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-5 w-5 shrink-0 text-success-600 dark:text-success-400" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Engagement Rate</p>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">--</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Top Performing Post</p>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">--</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analytics coming soon</p>
                  </div>
                </div>
                <div className="rounded-xl border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/30">
                  <p className="text-sm font-semibold text-info-900 dark:text-info-300">💡 Tip</p>
                  <p className="mt-1.5 text-sm text-info-700 dark:text-info-400">
                    Connect more platforms and publish regularly to see detailed performance metrics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-5 w-5 shrink-0 text-success-600 dark:text-success-400" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Engagement Rate</p>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {performanceSummary.engagement_rate !== null
                        ? `${performanceSummary.engagement_rate.toFixed(1)}%`
                        : "--"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {performanceSummary.total_posts} posts
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Top Performing Post</p>
                    </div>
                    {performanceSummary.top_performing_post ? (
                      <>
                        <p className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {performanceSummary.top_performing_post.name}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {performanceSummary.top_performing_post.impressions.toLocaleString()} impressions • {performanceSummary.top_performing_post.engagement_rate.toFixed(1)}% engagement
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">--</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No data available</p>
                      </>
                    )}
                  </div>
                </div>
                {performanceSummary.total_impressions > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Impressions</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-gray-100">{performanceSummary.total_impressions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Reach</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-gray-100">{performanceSummary.total_reach.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Likes</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-gray-100">{performanceSummary.total_likes.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Comments</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-gray-100">{performanceSummary.total_comments.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 dark:text-gray-100">Quick Actions</h2>
            <div className="space-y-3">
              {/* Industry-specific actions */}
              {tenantIndustry?.capabilities.has_products && (
                <Link
                  href="/app/products"
                  className="btn-secondary w-full justify-start"
                >
                  <PackageIcon className="w-5 h-5" />
                  <span>Add Product</span>
                </Link>
              )}
              {tenantIndustry?.capabilities.has_menu && (
                <Link
                  href="/app/menu-items"
                  className="btn-secondary w-full justify-start"
                >
                  <PackageIcon className="w-5 h-5" />
                  <span>Add Menu Item</span>
                </Link>
              )}
              {tenantIndustry?.capabilities.has_services && (
                <Link
                  href="/app/services"
                  className="btn-secondary w-full justify-start"
                >
                  <PackageIcon className="w-5 h-5" />
                  <span>Add Service</span>
                </Link>
              )}
              
              {/* General actions */}
              <Link
                href="/app/posts/new"
                className="btn-primary w-full justify-start"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Post</span>
              </Link>
              <Link
                href="/app/calendar"
                className="btn-secondary w-full justify-start"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>View Calendar</span>
              </Link>
              <Link
                href="/app/inbox"
                className="btn-secondary w-full justify-start"
              >
                <InboxIcon className="w-5 h-5" />
                <span>Check Inbox</span>
              </Link>
            </div>
          </div>

          {/* Recent Items - Industry Specific */}
          {(tenantIndustry?.capabilities.has_products || tenantIndustry?.capabilities.has_menu || tenantIndustry?.capabilities.has_services) && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Items</h2>
              </div>
              <div className="space-y-4">
                {tenantIndustry?.capabilities.has_products && products.length > 0 && (
                  <div>
                    <Link
                      href="/app/products"
                      className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-accent transition-colors dark:text-gray-300 dark:hover:text-accent"
                    >
                      <span>Recent Products</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <div className="space-y-2">
                      {products.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          href="/app/products"
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-accent/50 hover:bg-accent/5 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                        >
                          <PackageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{product.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-accent transition-colors dark:text-gray-300 dark:hover:text-accent"
                    >
                      <span>Recent Menu Items</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <div className="space-y-2">
                      {menuItems.slice(0, 3).map((item) => (
                        <Link
                          key={item.id}
                          href="/app/menu-items"
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-accent/50 hover:bg-accent/5 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                        >
                          <PackageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-accent transition-colors dark:text-gray-300 dark:hover:text-accent"
                    >
                      <span>Recent Services</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <div className="space-y-2">
                      {services.slice(0, 3).map((service) => (
                        <Link
                          key={service.id}
                          href="/app/services"
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-accent/50 hover:bg-accent/5 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                        >
                          <PackageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{service.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                    <PackageIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">No items yet</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add your first item to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Posts */}
          <div className="card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Upcoming Posts</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Next scheduled</p>
              </div>
              <Link
                href="/app/campaigns"
                className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                View all
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingPosts.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                  <ClockIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <p className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">No upcoming posts</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Schedule your first post to get started</p>
                </div>
              ) : (
                upcomingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href="/app/campaigns"
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-accent/50 hover:bg-accent/5 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{post.name}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {Array.isArray(post.platforms) && post.platforms.length > 0
                          ? post.platforms.join(", ")
                          : "No platforms"}
                      </p>
                      {post.scheduled_at && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(post.scheduled_at).toLocaleString([], {
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
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-gray-900 capitalize dark:text-gray-100">{tenant?.status ?? "active"}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Workspace is healthy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
