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
  SparklesIcon,
} from "../components/icons";
import { OrderCard, PaymentCard } from "../components/cards";
import { NotificationsPanel } from "../components/dashboard/NotificationsPanel";
import { AdventureWidget } from "../components/onboarding/AdventureWidget";
import AIStatusSummary from "../components/dashboard/AIStatusSummary";

// Helper for consistent layout
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TenantOverviewPage() {
  const { tenant } = useTenant();
  const { data: tenantIndustry } = useTenantIndustry();

  // Scroll ref
  const scrollContainerRef = useMemo(() => ({ current: null }), []);

  // Fetch all dashboard data
  const { data: overviewData } = useQuery({
    queryKey: ["tenant", "overview"],
    queryFn: () => tenantApi.overview(),
  });

  const { data: scheduledPostsData } = useScheduledPosts();
  const { data: upcomingPostsData } = useScheduledPosts({ status: "scheduled", limit: 5 });
  const { data: performanceSummary } = usePerformanceSummary("7d");
  const { data: integrationsData } = useIntegrations();
  const { data: conversationsData } = useConversations({ limit: 100 });
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
  const scheduledPosts = useMemo(() => Array.isArray(scheduledPostsData) ? scheduledPostsData : [], [scheduledPostsData]);
  const integrations = useMemo(() => Array.isArray(integrationsData) ? integrationsData : [], [integrationsData]);
  const conversations = useMemo(() => Array.isArray(conversationsData) ? conversationsData : [], [conversationsData]);
  const escalations = useMemo(() => escalationsData?.escalations || [], [escalationsData]);
  const mediaItems = useMemo(() => mediaData || [], [mediaData]);
  const orders = useMemo(() => ordersData?.orders || [], [ordersData]);
  const payments = useMemo(() => paymentsData?.payments || [], [paymentsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPosts = scheduledPosts.length;
    const publishedPosts = scheduledPosts.filter((p) => p.status === "posted").length;
    const activeConversations = conversations.length;
    const pendingEscalations = escalationStatsData?.pending ?? escalations.length;
    const connectedPlatforms = integrations.filter((i) => i.connected).length;
    const totalPlatforms = integrations.length || 4;
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

  // Attention Items - Escalations and Unread Conversations (Priority)
  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "conversation" | "escalation";
      title: string;
      description: string;
      timestamp: Date;
      icon: React.ReactNode;
      href: string;
      color: string;
      priority?: string;
    }> = [];

    // Unread conversations
    conversations
      .filter((c) => (c.unread_count || 0) > 0)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .forEach((conv) => {
        items.push({
          id: `conv-${conv.id}`,
          type: "conversation",
          title: `${conv.unread_count} unread message${conv.unread_count > 1 ? 's' : ''}`,
          description: `${conv.customer_name} on ${conv.platform}`,
          timestamp: new Date(conv.updated_at),
          icon: <InboxIcon className="w-4 h-4" />,
          href: `/app/inbox?conversation=${conv.id}`,
          color: "text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/30",
        });
      });

    // Pending escalations
    escalations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach((esc) => {
        items.push({
          id: `esc-${esc.id}`,
          type: "escalation",
          title: "Escalation requires action",
          description: `${esc.customerName} - ${esc.intent}`,
          timestamp: new Date(esc.createdAt),
          icon: <AlertIcon className="w-4 h-4" />,
          href: `/app/escalations/${esc.id}`,
          color: "text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-900/30",
          priority: esc.priority,
        });
      });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [conversations, escalations]);

  // Activity Log Items - Posts and Resolved Items (Secondary)
  const logItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "post" | "media";
      title: string;
      description: string;
      timestamp: Date;
      icon: React.ReactNode;
      href: string;
      color: string;
    }> = [];

    // Published posts
    scheduledPosts
      .filter((p) => p.status === "posted")
      .sort((a, b) => new Date(b.scheduled_at || b.created_at).getTime() - new Date(a.scheduled_at || a.created_at).getTime())
      .slice(0, 3)
      .forEach((post) => {
        items.push({
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

    // Media uploads (demoted to log)
    mediaItems
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach((media) => {
        items.push({
          id: `media-${media.id}`,
          type: "media",
          title: "Media uploaded",
          description: media.name || "New media",
          timestamp: new Date(media.created_at),
          icon: <ImageIcon className="w-4 h-4" />,
          href: `/app/media`,
          color: "text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800",
        });
      });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [scheduledPosts, mediaItems]);

  const upcomingPosts = useMemo(() => {
    const posts = Array.isArray(upcomingPostsData) ? upcomingPostsData : [];
    return posts.sort((a, b) => {
      const aTime = a.scheduled_at || "";
      const bTime = b.scheduled_at || "";
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
  }, [upcomingPostsData]);

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
    <div className="fixed inset-0 left-0 lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* AI Status Summary */}
          <AIStatusSummary />

          {/* AI Command Center Header */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-5 shadow-lg dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-6">
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
              <div className="absolute inset-0 dark:hidden" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
                <div>
                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    {firstWord ? `${firstWord}'s` : "Your"} AI Command Center
                  </h1>
                  <p className="text-sm text-white/80">
                    Here&apos;s how your business is performing today
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Adventure Widget - Getting Started Checklist */}
          <AdventureWidget />

          {/* Critical Alerts Banner */}
          {(stats.pendingEscalations > 0 || stats.unreadMessages > 0) && (
            <NotificationsPanel
              unreadMessages={stats.unreadMessages}
              pendingEscalations={stats.pendingEscalations}
              recentConversations={conversations
                .filter((c) => (c.unread_count || 0) > 0)
                .slice(0, 3)
                .map((c) => ({
                  id: c.id.toString(),
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
          )}

          {/* Key Metrics Grid - Enhanced Modern Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Posts */}
            <Link
              href="/app/campaigns"
              className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:border-info-400 hover:shadow-xl hover:-translate-y-1 dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50"
            >
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-info-400/30 to-info-500/30 blur-3xl transition-transform group-hover:scale-150 group-hover:opacity-60" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Content</p>
                    <p className="mt-3 text-5xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalPosts}</p>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <CheckCircleIcon className="h-4 w-4 text-success-500" />
                      {stats.publishedPosts} live posts
                    </p>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-info-500 via-info-600 to-info-700 text-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl">
                    <RocketIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Active Conversations */}
            <Link
              href="/app/inbox"
              className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:border-success-400 hover:shadow-xl hover:-translate-y-1 dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50"
            >
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-success-400/30 to-success-500/30 blur-3xl transition-transform group-hover:scale-150 group-hover:opacity-60" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Customer Chats</p>
                    <p className="mt-3 text-5xl font-extrabold text-gray-900 dark:text-gray-100">{stats.activeConversations}</p>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stats.unreadMessages > 0 ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                          {stats.unreadMessages} unread
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 text-success-500" />
                          All caught up
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-success-500 via-success-600 to-success-700 text-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl">
                    <UserGroupIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Pending Escalations */}
            <Link
              href="/app/escalations"
              className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:border-warning-400 hover:shadow-xl hover:-translate-y-1 dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50"
            >
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-warning-400/30 to-warning-500/30 blur-3xl transition-transform group-hover:scale-150 group-hover:opacity-60" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Need Your Attention</p>
                    <p className="mt-3 text-5xl font-extrabold text-gray-900 dark:text-gray-100">{stats.pendingEscalations}</p>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stats.pendingEscalations > 0 ? (
                        <>
                          <AlertIcon className="h-4 w-4 text-warning-500" />
                          Action required
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 text-success-500" />
                          You&apos;re all caught up
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 via-warning-600 to-warning-700 text-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl">
                    <AlertIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Connected Platforms */}
            <Link
              href="/app/integrations"
              className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-md transition-all duration-300 hover:border-accent-400 hover:shadow-xl hover:-translate-y-1 dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50"
            >
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-accent-400/30 to-accent-500/30 blur-3xl transition-transform group-hover:scale-150 group-hover:opacity-60" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Channels</p>
                    <p className="mt-3 text-5xl font-extrabold text-gray-900 dark:text-gray-100">
                      {stats.connectedPlatforms}
                      {stats.totalPlatforms > 0 && (
                        <span className="ml-2 text-3xl font-semibold text-gray-500 dark:text-gray-300">/{stats.totalPlatforms}</span>
                      )}
                    </p>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <LinkIcon className="h-4 w-4 text-accent-500" />
                      AI is active
                    </p>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 text-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Main Content Grid - Mobile First */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
            {/* Left Column - Activity & Performance (8 cols on large) */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* 🔴 Needs Attention - Priority Section */}
              <div className="rounded-2xl border-2 border-error-200 bg-gradient-to-br from-error-50 to-white p-6 shadow-lg dark:border-error-800 dark:from-error-900/20 dark:to-gray-800/50 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
                      <AlertIcon className="h-5 w-5 text-error-600 dark:text-error-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🔴 Needs Attention</h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Escalations and unread messages</p>
                    </div>
                  </div>
                  <Link
                    href="/app/escalations"
                    className="hidden items-center gap-2 rounded-lg bg-error-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-error-700 sm:inline-flex"
                  >
                    Review All
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {attentionItems.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-success-300 bg-gradient-to-br from-success-50 to-white p-8 text-center dark:border-success-800 dark:from-success-900/20 dark:to-gray-800">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                        <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
                      </div>
                      <p className="mt-4 text-base font-bold text-success-700 dark:text-success-300">All clear!</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No pending escalations or unread messages</p>
                    </div>
                  ) : (
                    attentionItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex items-start gap-4 rounded-xl border-2 border-error-100 bg-white p-4 transition-all duration-200 hover:border-error-300 hover:shadow-lg active:scale-[0.98] dark:border-error-800/50 dark:bg-gray-800 dark:hover:border-error-600"
                      >
                        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110", item.color)}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                            {item.priority && (item.priority === 'critical' || item.priority === 'urgent') && (
                              <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-700 dark:bg-error-900/30 dark:text-error-300">
                                {item.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">{item.description}</p>
                          <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 shrink-0 text-error-400 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* 🟢 Activity Log - Secondary Section */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                      <CheckCircleIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🟢 Activity Log</h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Recent posts and media</p>
                    </div>
                  </div>
                  <Link
                    href="/app/campaigns"
                    className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-accent hover:bg-accent hover:text-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:inline-flex"
                  >
                    View all
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {logItems.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-8 text-center dark:border-gray-600 dark:from-gray-800/50 dark:to-gray-800">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <ClockIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                      </div>
                      <p className="mt-4 text-base font-bold text-gray-700 dark:text-gray-200">No activity yet</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Publish your first post to see it here</p>
                    </div>
                  ) : (
                    logItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex items-start gap-4 rounded-xl border-2 border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                      >
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm", item.color)}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{item.description}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* AI Performance Summary */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Performance</h2>
                  <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-300">How your AI is helping your business</p>
                </div>

                {/* AI Metrics - Always show, even if zero */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm dark:border-purple-800 dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 shadow-sm dark:from-purple-900/30 dark:to-purple-900/50 dark:text-purple-400">
                        <SparklesIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">AI Handled</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                          {escalationStatsData ? `${(100 - (escalationStatsData.pending / Math.max(escalationStatsData.total, 1) * 100)).toFixed(0)}%` : "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Conversations without escalation</p>
                  </div>

                  <div className="rounded-xl border-2 border-success-200 bg-gradient-to-br from-success-50 to-white p-5 shadow-sm dark:border-success-800 dark:from-success-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-success-100 to-success-200 text-success-600 shadow-sm dark:from-success-900/30 dark:to-success-900/50 dark:text-success-400">
                        <CheckCircleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Resolved</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                          {escalationStatsData?.resolved ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Escalations resolved this week</p>
                  </div>

                  <div className="rounded-xl border-2 border-info-200 bg-gradient-to-br from-info-50 to-white p-5 shadow-sm dark:border-info-800 dark:from-info-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-info-100 to-info-200 text-info-600 shadow-sm dark:from-info-900/30 dark:to-info-900/50 dark:text-info-400">
                        <ClockIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Avg Response</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                          {escalationStatsData?.avgResponseTime ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Average AI response time</p>
                  </div>

                  <div className="rounded-xl border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-white p-5 shadow-sm dark:border-warning-800 dark:from-warning-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warning-100 to-warning-200 text-warning-600 shadow-sm dark:from-warning-900/30 dark:to-warning-900/50 dark:text-warning-400">
                        <InboxIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Conversations</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                          {stats.activeConversations}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Total active chats</p>
                  </div>
                </div>

                {/* Social Metrics - Secondary (Only show if data exists) */}
                {performanceSummary && performanceSummary.total_impressions > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Social Performance</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: "Impressions", value: performanceSummary.total_impressions },
                        { label: "Reach", value: performanceSummary.total_reach },
                        { label: "Likes", value: performanceSummary.total_likes },
                        { label: "Comments", value: performanceSummary.total_comments },
                      ].map((metric) => (
                        <div key={metric.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
                          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{metric.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Orders & Payments - Side by Side */}
              {(orders.length > 0 || payments.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {orders.length > 0 && (
                    <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Orders</h2>
                          <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-300">Latest transactions</p>
                        </div>
                        <Link
                          href="/app/orders"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-accent hover:bg-accent hover:text-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-accent"
                        >
                          View all
                          <ArrowRightIcon className="h-4 w-4" />
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

                  {payments.length > 0 && (
                    <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Payments</h2>
                          <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-300">Latest payments</p>
                        </div>
                        <Link
                          href="/app/payments"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-accent hover:bg-accent hover:text-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-accent"
                        >
                          View all
                          <ArrowRightIcon className="h-4 w-4" />
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
            </div>

            {/* Right Column - Quick Actions & Upcoming (4 cols on large) */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              {/* Quick Actions - AI Focused */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">What should I do now?</h2>
                <div className="space-y-3">
                  {/* Review Escalations - Top Priority */}
                  <Link
                    href="/app/escalations"
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95",
                      stats.pendingEscalations > 0
                        ? "border-2 border-error-500 bg-gradient-to-r from-error-500 to-error-600 text-white shadow-lg hover:shadow-xl"
                        : "border-2 border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    )}
                  >
                    <AlertIcon className="w-5 h-5" />
                    <span>Review Escalations</span>
                    {stats.pendingEscalations > 0 && (
                      <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                        {stats.pendingEscalations}
                      </span>
                    )}
                    <ArrowRightIcon className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>

                  {/* Check Inbox */}
                  <Link
                    href="/app/inbox"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all hover:border-accent active:scale-95",
                      stats.unreadMessages > 0
                        ? "border-2 border-warning-400 bg-warning-50 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200"
                        : "border-2 border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    )}
                  >
                    <InboxIcon className="w-5 h-5" />
                    <span>Respond to Messages</span>
                    {stats.unreadMessages > 0 && (
                      <span className="ml-auto rounded-full bg-warning-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                        {stats.unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Create Post with AI */}
                  <Link
                    href="/app/posts/new"
                    className="group flex w-full items-center gap-3 rounded-xl border-2 border-accent bg-gradient-to-r from-accent to-accent/90 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Create Post with AI</span>
                    <ArrowRightIcon className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>

                  {/* Train AI */}
                  <Link
                    href="/app/settings/ai"
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 active:scale-95 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/30"
                  >
                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                    <span>Train AI from Chats</span>
                  </Link>
                </div>
              </div>

              {/* Upcoming Posts */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-800/50 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming</h2>
                    <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-300">Next scheduled posts</p>
                  </div>
                  <Link
                    href="/app/campaigns"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-accent hover:bg-accent hover:text-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-accent"
                  >
                    View all
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingPosts.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-accent-200 bg-gradient-to-br from-accent-50 to-white p-6 text-center dark:border-accent-800 dark:from-accent-900/20 dark:to-gray-800">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30">
                        <SparklesIcon className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                      </div>
                      <p className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100">No posts scheduled</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">AI can help you plan your content</p>
                      <Link
                        href="/app/posts/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-accent/90 transition-all"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Schedule a Post
                      </Link>
                    </div>
                  ) : (
                    upcomingPosts.map((post) => (
                      <Link
                        key={post.id}
                        href="/app/campaigns"
                        className="group flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-accent/50 hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:shadow-md active:scale-[0.98] dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-800"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-info-100 to-info-200 text-info-600 shadow-sm dark:from-info-900/30 dark:to-info-900/50 dark:text-info-400">
                          <ClockIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate dark:text-gray-100">{post.name}</p>
                          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {Array.isArray(post.platforms) && post.platforms.length > 0
                              ? post.platforms.join(", ")
                              : "No platforms"}
                          </p>
                          {post.scheduled_at && (
                            <p className="mt-1.5 text-xs font-semibold text-gray-500 dark:text-gray-300">
                              {new Date(post.scheduled_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                        <ArrowRightIcon className="h-5 w-5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
