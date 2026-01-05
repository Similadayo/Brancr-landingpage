'use client';

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, tenantApi } from "@/lib/api";
import { toast } from 'react-hot-toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-messages';
import { useTenant } from "../providers/TenantProvider";
import { useIntegrations } from "../hooks/useIntegrations";
import { useTenantIndustry } from "../hooks/useIndustry";
import { useEffect, useRef } from "react";
import {
  HomeIcon,
  InboxIcon,
  AlertIcon,
  RocketIcon,
  CalendarIcon,
  ImageIcon,
  PackageIcon,
  LinkIcon,
  ChartIcon,
  SettingsIcon,
  ClipboardIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon,
  MenuIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  CreditCardIcon,
  BellIcon,
} from "./icons";
import { CommandPalette } from "./CommandPalette";
import { NotificationsBell } from "./NotificationsBell";
import AIToggle from './AIToggle';
import ThemeToggle from "@/app/components/ThemeToggle";
import { useScheduledPosts } from "../hooks/useScheduledPosts";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number | string;
};

// Core navigation items (always visible) - will be populated with dynamic badges
const getCoreNavItems = (badges?: { inbox?: number; escalations?: number; alerts?: number }): NavItem[] => [
  { label: "Overview", href: "/app", icon: <HomeIcon className="w-5 h-5" /> },
  { label: "Inbox", href: "/app/inbox", icon: <InboxIcon className="w-5 h-5" />, badge: badges?.inbox },
  { label: "Escalations", href: "/app/escalations", icon: <AlertIcon className="w-5 h-5" />, badge: badges?.escalations },
  { label: "Campaigns", href: "/app/campaigns", icon: <RocketIcon className="w-5 h-5" /> },
  { label: "Bulk Upload", href: "/app/bulk-uploads", icon: <ClipboardIcon className="w-5 h-5" /> },
  { label: "Payments", href: "/app/payments", icon: <CreditCardIcon className="w-5 h-5" /> },
  { label: "Orders", href: "/app/orders", icon: <PackageIcon className="w-5 h-5" /> },
  { label: "Calendar", href: "/app/calendar", icon: <CalendarIcon className="w-5 h-5" /> },
];

// TikTok section removed - TikTok is now integrated into unified Campaigns and Analytics views

// Media with submenu
const MEDIA_NAV_ITEM: NavItem = { label: "Media", href: "/app/media", icon: <ImageIcon className="w-5 h-5" /> };

// Settings section items (grouped)
const SETTINGS_NAV_ITEMS_BASE: NavItem[] = [
  { label: "Integrations", href: "/app/integrations", icon: <LinkIcon className="w-5 h-5" /> },
  { label: "Analytics", href: "/app/analytics", icon: <ChartIcon className="w-5 h-5" /> },
  { label: "Payment Accounts", href: "/app/settings/payment-accounts", icon: <CreditCardIcon className="w-5 h-5" /> },
  { label: "Notifications", href: "/app/settings/notifications", icon: <BellIcon className="w-5 h-5" /> },
  { label: "Settings", href: "/app/settings", icon: <SettingsIcon className="w-5 h-5" /> },
];
const ONBOARDING_SUMMARY_ITEM: NavItem = { label: "Onboarding Summary", href: "/app/settings/onboarding", icon: <ClipboardIcon className="w-5 h-5" /> };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Helper function to get display name and initials from tenant
function getTenantDisplayInfo(tenant: any) {
  const displayName = (
    tenant?.business_profile?.name?.trim() ||
    tenant?.business_name?.trim() ||
    tenant?.name?.trim() ||
    tenant?.email?.split("@")[0] ||
    "User"
  );

  const nameParts = displayName.split(/\s+/).filter(Boolean);
  let initials = "";

  if (nameParts.length > 0) {
    const firstInitial = nameParts[0]?.charAt(0)?.toUpperCase() || "";
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0)?.toUpperCase() || "" : "";
    initials = firstInitial + lastInitial;
  }

  // Ensure we always have at least one initial
  if (!initials || initials.length === 0) {
    initials = displayName.charAt(0).toUpperCase() || "U";
  }

  return { displayName, initials };
}

export function TenantShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, loading, error, refresh } = useTenant();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isInboxPage = pathname?.startsWith("/app/inbox");

  // Check onboarding status
  const { data: onboardingStatus } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
    enabled: !!tenant,
  });

  // Fetch tenant industry for conditional navigation
  const { data: tenantIndustry } = useTenantIndustry();

  // Fetch stats for header - use the hook to get processed integrations (includes WhatsApp)
  const { data: integrationsData } = useIntegrations();
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];

  // Use the same hook as Overview page for consistency
  const { data: scheduledPostsData } = useScheduledPosts();
  const scheduledPosts = Array.isArray(scheduledPostsData) ? scheduledPostsData : [];

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => tenantApi.conversations(),
    enabled: !!tenant,
  });

  const stats = useMemo(() => {
    const connectedChannels = integrations.filter((i) => i.connected).length;
    const totalChannels = 4; // Always 4 platforms: Facebook, Instagram, Telegram, WhatsApp
    // Count all posts (same as Overview page)
    const totalPosts = scheduledPosts.length;
    const conversations = conversationsData?.conversations?.length || 0;
    return { connectedChannels, totalChannels, scheduledPosts: totalPosts, conversations };
  }, [integrations, scheduledPosts, conversationsData]);

  // Fetch escalations for badge count
  const { data: escalationsData } = useQuery({
    queryKey: ["escalations"],
    queryFn: () => tenantApi.escalations({ limit: 100 }),
    enabled: !!tenant,
  });

  // Fetch alerts count for badge
  const { data: alertCounts } = useQuery({
    queryKey: ["alert-counts"],
    queryFn: () => tenantApi.getAlertCounts(),
    enabled: !!tenant,
    refetchInterval: 30_000,
  });

  const navBadges = useMemo(() => {
    const conversations = Array.isArray(conversationsData?.conversations)
      ? conversationsData?.conversations
      : [];
    const unreadConversations = conversations.filter((c: any) => (c.unread_count ?? 0) > 0).length;
    const pendingEscalations = escalationsData?.escalations?.filter((e: any) => e.status === "pending").length || 0;
    const unreadAlerts = alertCounts?.unread ?? 0;
    return {
      inbox: unreadConversations > 0 ? unreadConversations : undefined,
      escalations: pendingEscalations > 0 ? pendingEscalations : undefined,
      alerts: unreadAlerts > 0 ? unreadAlerts : undefined,
    };
  }, [conversationsData, escalationsData, alertCounts]);

  // AI mode query and header toggle mutation
  const { data: aiModeData, isLoading: isLoadingAIMode } = useQuery({
    queryKey: ['ai_mode'],
    queryFn: () => tenantApi.getAIMode(),
    enabled: !!tenant,
  });
  const queryClient = useQueryClient();
  const supportsGetAIMode = process.env.NEXT_PUBLIC_SUPPORTS_AIMODE_GET === 'true';
  const [displayAIMode, setDisplayAIMode] = useState<'ai' | 'human'>(() => {
    if (typeof window === 'undefined') return 'ai';
    const override = (localStorage.getItem('ai_mode_override') as 'ai' | 'human' | null);
    return override ?? 'ai';
  });
  useEffect(() => {
    if (aiModeData?.mode) setDisplayAIMode(aiModeData.mode);
  }, [aiModeData]);
  const updateAIModeMutation = useMutation({
    mutationFn: (mode: 'ai' | 'human') => tenantApi.updateAIMode(mode),
    onMutate: (mode) => {
      setDisplayAIMode(mode);
      queryClient.setQueryData(['ai_mode'], { mode });
      if (!supportsGetAIMode && typeof window !== 'undefined') {
        try { localStorage.setItem('ai_mode_override', mode); } catch { }
      }
    },
    onSuccess: (data) => {
      toast.success(`AI mode set to ${data.mode === 'ai' ? 'AI (enabled)' : 'Human (disabled)'}`);
      queryClient.setQueryData(['ai_mode'], data);
    },
    onError: (err) => {
      const msg = getUserFriendlyErrorMessage(err, { action: 'updating AI mode', resource: 'AI mode' });
      toast.error(msg || 'Failed to update AI mode');
      queryClient.invalidateQueries({ queryKey: ['ai_mode'] });
    },
  });

  const CORE_NAV_ITEMS = useMemo(() => getCoreNavItems(navBadges), [navBadges]);

  // Industry-based navigation items
  const industryNavItems = useMemo(() => {
    const items: NavItem[] = [];
    if (tenantIndustry?.capabilities.has_products) {
      items.push({ label: "Products", href: "/app/products", icon: <PackageIcon className="w-5 h-5" /> });
    }
    if (tenantIndustry?.capabilities.has_menu) {
      items.push({ label: "Menu", href: "/app/menu-items", icon: <PackageIcon className="w-5 h-5" /> });
    }
    // Show Services when industry supports services
    if (tenantIndustry?.capabilities.has_services) {
      items.push({ label: "Services", href: "/app/services", icon: <PackageIcon className="w-5 h-5" /> });
    }
    return items;
  }, [tenantIndustry]);

  // Settings items including conditional Onboarding Summary
  const settingsNavItems = useMemo(() => {
    const items = [...SETTINGS_NAV_ITEMS_BASE];
    // Add Onboarding Summary only if onboarding is complete
    if (onboardingStatus?.complete) {
      items.push(ONBOARDING_SUMMARY_ITEM);
    }
    return items;
  }, [onboardingStatus]);

  // Auto-expand Media if on bulk-uploads page
  useEffect(() => {
    if (pathname?.startsWith("/app/media")) {
      setIsMediaExpanded(true);
    }
  }, [pathname]);

  const currentNav = useMemo(() => {
    const allItems = [...CORE_NAV_ITEMS, ...industryNavItems, MEDIA_NAV_ITEM, ...settingsNavItems];
    const matched = allItems.reduce<NavItem | undefined>((best, item) => {
      const overviewMatch = item.href === "/app" && (pathname === "/app" || pathname === "/app/");
      const specificMatch =
        item.href !== "/app" &&
        (pathname === item.href || `${pathname ?? ""}/`.startsWith(`${item.href}/`));

      if (overviewMatch || specificMatch) {
        if (!best || item.href.length > best.href.length) {
          return item;
        }
      }
      return best;
    }, undefined);

    return matched ?? CORE_NAV_ITEMS[0];
  }, [pathname, settingsNavItems, industryNavItems, CORE_NAV_ITEMS]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authApi.logout();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-bg dark:bg-dark-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-bg dark:bg-dark-bg px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">We couldn&apos;t load your workspace</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-dark-text-secondary">{error}</p>
          <button
            onClick={refresh}
            className="mt-6 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 dark:bg-dark-accent-primary dark:text-white dark:hover:bg-[#6BB8FF]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const sidebarDesktopWidth = isSidebarCollapsed ? 92 : 276;
  const sidebarWidthClass = isSidebarCollapsed ? "w-[92px]" : "w-[276px]";

  function renderNavItem(item: NavItem, compact: boolean, isActive: boolean) {
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsMobileNavOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
          !compact && "hover:bg-gray-50 dark:hover:bg-gray-700/30",
          compact && "justify-center"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary group-hover:bg-gray-200 dark:group-hover:bg-dark-elevated"
          )}
          aria-hidden
        >
          {item.icon}
          {item.badge && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
              {typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </span>
        {!compact && (
          <>
            <span className={cn(
              "flex-1 font-medium",
              isActive ? "text-gray-900 dark:text-dark-text-primary" : "text-gray-600 dark:text-dark-text-secondary"
            )}>
              {item.label}
            </span>
          </>
        )}
      </Link>
    );
  }

  function renderNavItems(compact: boolean) {
    return (
      <nav className="mt-8 space-y-2">
        {/* Core Navigation */}
        {CORE_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/app"
            ? pathname === "/app" || pathname === "/app/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return renderNavItem(item, compact, isActive);
        })}

        {/* Industry-based navigation items */}
        {industryNavItems.length > 0 && (
          <>
            {industryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return renderNavItem(item, compact, isActive);
            })}
          </>
        )}

        {/* Media */}
        {renderNavItem(MEDIA_NAV_ITEM, compact, pathname === MEDIA_NAV_ITEM.href || pathname?.startsWith(`${MEDIA_NAV_ITEM.href}/`))}

        {/* Settings Section (Collapsible) */}
        {!compact && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-elevated transition"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary">
                  <SettingsIcon className="w-5 h-5" />
                </span>
                <span>Settings</span>
              </span>
              <span className="text-xs text-gray-400 dark:text-dark-text-secondary" aria-hidden>
                {isSettingsExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </span>
            </button>
            {isSettingsExpanded && (
              <div className="mt-2 space-y-2">
                {settingsNavItems.map((item) => {
                  const isSettingsRoot = item.href === "/app/settings";
                  const isActive = isSettingsRoot
                    ? pathname === "/app/settings" || pathname === "/app/settings/"
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return renderNavItem(item, compact, isActive);
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Section (Compact/Collapsed) */}
        {compact && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-border">
            {settingsNavItems.map((item) => {
              const isSettingsRoot = item.href === "/app/settings";
              const isActive = isSettingsRoot
                ? pathname === "/app/settings" || pathname === "/app/settings/"
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return renderNavItem(item, compact, isActive);
            })}
          </div>
        )}
      </nav>
    );
  }

  return (
    <div
      data-tenant-shell
      data-tenant-page={isInboxPage ? "inbox" : "default"}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg overflow-x-hidden max-w-full w-full"
    >
      {/* Mobile overlay */}
      {isMobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-gray-200 bg-white dark:border-dark-border dark:bg-dark-surface px-6 py-6 shadow-2xl transition-transform lg:hidden",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/app" className="flex items-center justify-start">
            <span className="text-xl font-bold text-primary dark:text-white">Brancr.</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-2 text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-elevated"
            aria-label="Close navigation"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-8 flex h-[calc(100vh-8rem)] flex-col overflow-y-auto pr-1 scrollbar-thin">
          <div className="shrink-0">
            {renderNavItems(false)}
          </div>
          {/* AI Mode Toggle - Mobile Sidebar */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-dark-border">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-dark-text-secondary px-2">AI Mode</p>
            <AIToggle
              value={displayAIMode}
              onChange={(next) => {
                setDisplayAIMode(next);
                updateAIModeMutation.mutate(next);
              }}
              disabled={updateAIModeMutation.isPending || isLoadingAIMode}
              showLabel={true}
            />
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden px-3 lg:px-0">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 hidden h-screen shrink-0 border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-6 transition-all duration-300 lg:flex lg:flex-col z-30",
            sidebarWidthClass
          )}
        >
          <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "justify-start")}>
            <Link href="/app" className="flex items-center justify-start">
              {!isSidebarCollapsed ? (
                <span className="text-xl font-bold text-primary dark:text-white">Brancr.</span>
              ) : (
                <Image src="/logo-dark.svg" alt="Brancr" width={32} height={32} className="dark:brightness-0 dark:invert" />
              )}
            </Link>
          </div>
          <div
            className={cn(
              "mt-10 flex h-[calc(100vh-11rem)] flex-col space-y-6 overflow-y-auto pr-1 scrollbar-thin",
              isSidebarCollapsed && "items-center"
            )}
          >
            <div className="shrink-0">
              {renderNavItems(isSidebarCollapsed)}
            </div>
          </div>
          <div className="mt-auto space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            {/* AI Mode Toggle - Mobile/Desktop Sidebar - Hidden on larger screens */}
            <div className={cn("flex items-center justify-center lg:hidden", isSidebarCollapsed && "justify-center")}>
              {!isSidebarCollapsed ? (
                <div className="w-full">
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-2">AI Mode</p>
                  <AIToggle
                    value={displayAIMode}
                    onChange={(next) => {
                      setDisplayAIMode(next);
                      updateAIModeMutation.mutate(next);
                    }}
                    disabled={updateAIModeMutation.isPending || isLoadingAIMode}
                    showLabel={true}
                  />
                </div>
              ) : (
                <AIToggle
                  value={displayAIMode}
                  onChange={(next) => {
                    setDisplayAIMode(next);
                    updateAIModeMutation.mutate(next);
                  }}
                  disabled={updateAIModeMutation.isPending || isLoadingAIMode}
                  showLabel={false}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="flex w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-surface p-2 text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-elevated transition-colors"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeftIcon
                className={cn("w-5 h-5 transition-transform", isSidebarCollapsed && "rotate-180")}
              />
            </button>
          </div>
        </aside>

        <div className={cn("flex min-h-screen flex-1 flex-col min-w-0 max-w-full transition-all duration-300", isSidebarCollapsed ? "lg:ml-[92px]" : "lg:ml-[276px]")}>
          {/* Top Header Bar with Stats */}
          <header className="sticky top-0 z-20 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface w-full max-w-full">
            <div className="px-4 lg:px-6 max-w-full">
              <div className="flex h-16 items-center justify-between gap-4">
                {/* Left: Page Title */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="btn-ghost lg:hidden shrink-0"
                    aria-label="Open navigation menu"
                  >
                    <MenuIcon className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary sm:text-xl truncate">{currentNav?.label ?? "Overview"}</h1>
                  </div>
                </div>

                {/* Right: Stats and Controls */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  {/* Stats */}
                  <div className="hidden items-center gap-6 lg:flex">
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Connected</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">
                        {stats.connectedChannels}/{stats.totalChannels || 4}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-300">Posts</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">{stats.scheduledPosts}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">Conversations</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">{stats.conversations}</p>
                    </div>
                  </div>

                  {/* AI Mode Toggle - Hidden on mobile */}
                  <div className="hidden lg:flex items-center">
                    <AIToggle
                      value={displayAIMode}
                      onChange={(next) => {
                        setDisplayAIMode(next);
                        updateAIModeMutation.mutate(next);
                      }}
                      disabled={updateAIModeMutation.isPending || isLoadingAIMode}
                      showLabel={true}
                    />
                  </div>
                  <ThemeToggle />
                  <NotificationsBell />
                  {/* User Profile */}
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                      {(() => {
                        const { displayName, initials } = getTenantDisplayInfo(tenant);
                        return (
                          <>
                            {(tenant?.business_profile?.logo_url || tenant?.logo_url) ? (
                              <Image src={tenant?.business_profile?.logo_url || tenant?.logo_url!} alt={displayName} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                                {initials}
                              </span>
                            )}
                            <span className="hidden text-left leading-tight lg:block">
                              <span className="block text-xs font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-300 capitalize">{tenant?.plan ?? "trial"}</span>
                            </span>
                            <ChevronDownIcon
                              className={cn("w-4 h-4 text-gray-400 dark:text-gray-400 transition-transform", isProfileMenuOpen && "rotate-180")}
                              aria-hidden
                            />
                          </>
                        );
                      })()}
                    </button>
                    {isProfileMenuOpen ? (
                      <div className="absolute right-0 z-30 mt-2 w-48 card p-2 shadow-xl">
                        <Link
                          href="/app/settings"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-accent"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/app/settings/billing"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-accent"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Upgrade plan
                        </Link>
                        <button
                          type="button"
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            void handleSignOut();
                          }}
                        >
                          Sign out
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 pb-8 pt-6 lg:px-6 min-w-0 max-w-full overflow-x-hidden">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}

