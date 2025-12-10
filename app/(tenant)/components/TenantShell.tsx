'use client';

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi, tenantApi } from "@/lib/api";
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
} from "./icons";
import { CommandPalette } from "./CommandPalette";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number | string;
};

// Core navigation items (always visible) - will be populated with dynamic badges
const getCoreNavItems = (badges?: { inbox?: number; escalations?: number }): NavItem[] => [
  { label: "Overview", href: "/app", icon: <HomeIcon className="w-5 h-5" /> },
  { label: "Inbox", href: "/app/inbox", icon: <InboxIcon className="w-5 h-5" />, badge: badges?.inbox },
  { label: "Escalations", href: "/app/escalations", icon: <AlertIcon className="w-5 h-5" />, badge: badges?.escalations },
  { label: "Campaigns", href: "/app/campaigns", icon: <RocketIcon className="w-5 h-5" /> },
  { label: "Payments", href: "/app/payments", icon: <CreditCardIcon className="w-5 h-5" /> },
  { label: "Orders", href: "/app/orders", icon: <PackageIcon className="w-5 h-5" /> },
  { label: "Calendar", href: "/app/calendar", icon: <CalendarIcon className="w-5 h-5" /> },
];

// TikTok section removed - TikTok is now integrated into unified Campaigns and Analytics views

// Media with submenu
const MEDIA_NAV_ITEM: NavItem = { label: "Media", href: "/app/media", icon: <ImageIcon className="w-5 h-5" /> };
const BULK_UPLOADS_NAV_ITEM: NavItem = { label: "Bulk Uploads", href: "/app/bulk-uploads", icon: <PackageIcon className="w-5 h-5" /> };

// Settings section items (grouped)
const SETTINGS_NAV_ITEMS_BASE: NavItem[] = [
  { label: "Integrations", href: "/app/integrations", icon: <LinkIcon className="w-5 h-5" /> },
  { label: "Analytics", href: "/app/analytics", icon: <ChartIcon className="w-5 h-5" /> },
  { label: "Payment Accounts", href: "/app/settings/payment-accounts", icon: <CreditCardIcon className="w-5 h-5" /> },
  { label: "Notifications", href: "/app/settings/notifications", icon: <AlertIcon className="w-5 h-5" /> },
  { label: "Settings", href: "/app/settings", icon: <SettingsIcon className="w-5 h-5" /> },
];
const ONBOARDING_SUMMARY_ITEM: NavItem = { label: "Onboarding Summary", href: "/app/settings/onboarding", icon: <ClipboardIcon className="w-5 h-5" /> };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
  
  const { data: scheduledPostsData } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: () => tenantApi.scheduledPosts(),
    enabled: !!tenant,
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => tenantApi.conversations({ limit: 1 }),
    enabled: !!tenant,
  });

  const stats = useMemo(() => {
    const connectedChannels = integrations.filter((i) => i.connected).length;
    const totalChannels = 4; // Always 4 platforms: Facebook, Instagram, Telegram, WhatsApp
    const scheduledPosts = scheduledPostsData?.scheduled_posts?.length || 0;
    const conversations = conversationsData?.conversations?.length || 0;
    return { connectedChannels, totalChannels, scheduledPosts, conversations };
  }, [integrations, scheduledPostsData, conversationsData]);

  // Fetch escalations for badge count
  const { data: escalationsData } = useQuery({
    queryKey: ["escalations"],
    queryFn: () => tenantApi.escalations({ limit: 100 }),
    enabled: !!tenant,
  });

  const navBadges = useMemo(() => {
    const unreadConversations = conversationsData?.conversations?.filter((c: any) => c.unread_count > 0).length || 0;
    const pendingEscalations = escalationsData?.escalations?.filter((e: any) => e.status === "pending").length || 0;
    return {
      inbox: unreadConversations > 0 ? unreadConversations : undefined,
      escalations: pendingEscalations > 0 ? pendingEscalations : undefined,
    };
  }, [conversationsData, escalationsData]);

  const CORE_NAV_ITEMS = useMemo(() => getCoreNavItems(navBadges), [navBadges]);

  // Industry-based navigation items
  const industryNavItems = useMemo(() => {
    const items: NavItem[] = [];
    if (tenantIndustry?.capabilities.has_products) {
      items.push({ label: "Products", href: "/app/products", icon: <PackageIcon className="w-5 h-5" /> });
    }
    if (tenantIndustry?.capabilities.has_menu) {
      items.push({ label: "Menu Items", href: "/app/menu-items", icon: <PackageIcon className="w-5 h-5" /> });
    }
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
    if (pathname?.startsWith("/app/bulk-uploads")) {
      setIsMediaExpanded(true);
    }
  }, [pathname]);

  const currentNav = useMemo(() => {
    const allItems = [...CORE_NAV_ITEMS, ...industryNavItems, MEDIA_NAV_ITEM, BULK_UPLOADS_NAV_ITEM, ...settingsNavItems];
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
  }, [pathname, settingsNavItems, industryNavItems]);

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
      <div className="flex min-h-screen items-center justify-center bg-neutral-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-bg px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-gray-900">We couldn’t load your workspace</h1>
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <button
            onClick={refresh}
            className="mt-6 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
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
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
          isActive
            ? "bg-accent/10 text-accent shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition group-hover:bg-accent/10 group-hover:text-accent",
            isActive && "bg-accent text-white group-hover:bg-accent"
          )}
          aria-hidden
        >
          {item.icon}
        </span>
        {!compact ? (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                {typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            <span className="text-xs text-gray-400 group-hover:text-accent" aria-hidden>
              {isActive ? "•" : "→"}
            </span>
          </>
        ) : (
          item.badge && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
              {typeof item.badge === "number" && item.badge > 9 ? "9+" : item.badge}
            </span>
          )
        )}
      </Link>
    );
  }

  function renderNavItems(compact: boolean) {
    return (
      <nav className="mt-4 space-y-1">
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

        {/* Media with Bulk Uploads Submenu */}
        {!compact ? (
          <div className="mt-2">
            <div className="flex items-center gap-3">
              <Link
                href={MEDIA_NAV_ITEM.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={cn(
                  "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  (pathname === MEDIA_NAV_ITEM.href || pathname?.startsWith(`${MEDIA_NAV_ITEM.href}/`)) && !pathname?.startsWith(`${BULK_UPLOADS_NAV_ITEM.href}/`)
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-base transition group-hover:bg-accent/10 group-hover:text-accent",
                    (pathname === MEDIA_NAV_ITEM.href || pathname?.startsWith(`${MEDIA_NAV_ITEM.href}/`)) && !pathname?.startsWith(`${BULK_UPLOADS_NAV_ITEM.href}/`) && "bg-accent text-white group-hover:bg-accent"
                  )}
                  aria-hidden
                >
                  {MEDIA_NAV_ITEM.icon}
                </span>
                <span className="flex-1">{MEDIA_NAV_ITEM.label}</span>
                <span className="text-xs text-gray-400 group-hover:text-accent" aria-hidden>
                  {(pathname === MEDIA_NAV_ITEM.href || pathname?.startsWith(`${MEDIA_NAV_ITEM.href}/`)) && !pathname?.startsWith(`${BULK_UPLOADS_NAV_ITEM.href}/`) ? "•" : "→"}
                </span>
              </Link>
              <button
                onClick={() => setIsMediaExpanded(!isMediaExpanded)}
                className={cn(
                  "rounded-xl p-2 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600",
                  isMediaExpanded && "text-accent"
                )}
                aria-label={isMediaExpanded ? "Collapse Media submenu" : "Expand Media submenu"}
              >
                {isMediaExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {isMediaExpanded && (
              <div className="mt-1 space-y-1 pl-12">
                {renderNavItem(BULK_UPLOADS_NAV_ITEM, compact, pathname === BULK_UPLOADS_NAV_ITEM.href || pathname?.startsWith(`${BULK_UPLOADS_NAV_ITEM.href}/`))}
              </div>
            )}
          </div>
        ) : (
          <>
            {renderNavItem(MEDIA_NAV_ITEM, compact, pathname === MEDIA_NAV_ITEM.href || pathname?.startsWith(`${MEDIA_NAV_ITEM.href}/`))}
            {renderNavItem(BULK_UPLOADS_NAV_ITEM, compact, pathname === BULK_UPLOADS_NAV_ITEM.href || pathname?.startsWith(`${BULK_UPLOADS_NAV_ITEM.href}/`))}
          </>
        )}

        {/* Settings Section (Collapsible) */}
        {!compact && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </span>
              <span className="text-xs text-gray-400" aria-hidden>
                {isSettingsExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </span>
            </button>
            {isSettingsExpanded && (
              <div className="mt-2 space-y-1 pl-4">
                {settingsNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return renderNavItem(item, compact, isActive);
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Section (Compact/Collapsed) */}
        {compact && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return renderNavItem(item, compact, isActive);
            })}
          </div>
        )}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Mobile overlay */}
      {isMobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-gray-200 bg-white px-6 py-6 shadow-2xl transition-transform lg:hidden",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <Image src="/logo-dark.svg" alt="Brancr" width={36} height={36} />
            Brancr
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close navigation"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-10 flex h-[calc(100vh-8rem)] flex-col space-y-6 overflow-y-auto pr-1">
          <div className="shrink-0">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Navigate</p>
            {renderNavItems(false)}
          </div>
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 px-5 py-4 text-sm text-gray-600">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Plan</p>
            <p className="mt-2 text-base font-semibold text-gray-900 capitalize">{tenant.plan ?? "trial"}</p>
            <p className="mt-2 text-xs text-gray-500">
              Track usage, upgrade your plan, and manage billing from settings.
            </p>
                  <Link
                    href="/app/settings/billing"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white"
                  >
                    Manage plan <ExternalLinkIcon className="w-3 h-3" aria-hidden />
                  </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Account</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
              {(() => {
                const displayName = (tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || tenant?.email?.split("@")[0] || "User");
                const nameParts = displayName.split(/\s+/).filter(Boolean);
                const initials = (nameParts[0]?.charAt(0) || "U") + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "");
                const initialsUpper = initials.toUpperCase();
                return (
                  <>
                    {(tenant?.business_profile?.logo_url || tenant?.logo_url) ? (
                      <img src={tenant?.business_profile?.logo_url || tenant?.logo_url!} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {initialsUpper}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">{tenant?.email}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen w-full px-3 lg:px-8">
        {/* Desktop sidebar */}
        <aside
          className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-gray-200 bg-white px-4 py-6 transition-all duration-300 lg:flex lg:flex-col",
          sidebarWidthClass
          )}
        >
          <div className={cn("flex items-center gap-3", isSidebarCollapsed && "justify-center")}>
            <Link href="/app" className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Image src="/logo-dark.svg" alt="Brancr" width={36} height={36} />
              {!isSidebarCollapsed ? <span>Brancr</span> : null}
            </Link>
          </div>
          <div
            className={cn(
              "mt-10 flex h-[calc(100vh-11rem)] flex-col space-y-6 overflow-y-auto pr-1",
              isSidebarCollapsed && "items-center"
            )}
          >
            <div className="shrink-0">
              {!isSidebarCollapsed ? (
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Navigate</p>
              ) : null}
              {renderNavItems(isSidebarCollapsed)}
            </div>
            <div
              className={cn(
                "rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-4 text-sm text-gray-600 transition",
                isSidebarCollapsed && "px-3 text-center"
              )}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Plan</p>
              {!isSidebarCollapsed ? (
                <>
                  <p className="mt-3 text-base font-semibold text-gray-900 capitalize">{tenant.plan ?? "trial"}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Track usage, upgrade your plan, and manage billing from settings.
                  </p>
                  <Link
                    href="/app/settings/billing"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white"
                  >
                    Manage plan <ExternalLinkIcon className="w-3 h-3" aria-hidden />
                  </Link>
                </>
              ) : (
                <span className="mt-3 block text-xs font-semibold capitalize text-gray-900">
                  {tenant.plan ?? "trial"}
                </span>
              )}
            </div>
            <div
              className={cn(
                "rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm",
                isSidebarCollapsed && "px-2 text-center"
              )}
            >
              {!isSidebarCollapsed ? (
                <>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Account</p>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    {(() => {
                      const displayName = (tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || tenant?.email?.split("@")[0] || "User");
                      const nameParts = displayName.split(/\s+/).filter(Boolean);
                      const initials = (nameParts[0]?.charAt(0) || "U") + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "");
                      const initialsUpper = initials.toUpperCase();
                      return (
                        <>
                          {(tenant?.business_profile?.logo_url || tenant?.logo_url) ? (
                            <img src={tenant?.business_profile?.logo_url || tenant?.logo_url!} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                              {initialsUpper}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">{tenant?.email}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {(() => {
                    const displayName = (tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || tenant?.email?.split("@")[0] || "User");
                    const nameParts = displayName.split(/\s+/).filter(Boolean);
                    const initials = (nameParts[0]?.charAt(0) || "U") + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "");
                    const initialsUpper = initials.toUpperCase();
                    return (
                      <>
                        {(tenant?.business_profile?.logo_url || tenant?.logo_url) ? (
                          <img src={tenant?.business_profile?.logo_url || tenant?.logo_url!} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                            {initialsUpper}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-600">Account</span>
                      </>
                    );
                  })()}
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="mt-auto flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-500 transition hover:border-accent hover:text-accent"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeftIcon
              className={cn("w-5 h-5 transition-transform", isSidebarCollapsed && "rotate-180")}
            />
          </button>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top Header Bar with Stats */}
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
            <div className="px-4 lg:px-6">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-accent hover:text-accent lg:hidden"
                    aria-label="Open navigation menu"
                  >
                    <MenuIcon className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">{currentNav?.label ?? "Overview"}</h1>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Global Stats */}
                  <div className="hidden items-center gap-4 lg:flex">
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">Connected</p>
                      <p className="text-sm font-bold text-gray-900">
                        {stats.connectedChannels}/{stats.totalChannels || 4}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">Posts</p>
                      <p className="text-sm font-bold text-gray-900">{stats.scheduledPosts}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">Conversations</p>
                      <p className="text-sm font-bold text-gray-900">{stats.conversations}</p>
                    </div>
                  </div>
                  {/* User Profile */}
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-accent hover:text-accent"
                    >
                      {(() => {
                        const displayName = (tenant?.business_profile?.name?.trim() || tenant?.business_name?.trim() || tenant?.name?.trim() || tenant?.email?.split("@")[0] || "User");
                        const nameParts = displayName.split(/\s+/).filter(Boolean);
                        const initials = (nameParts[0]?.charAt(0) || "U") + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "");
                        const initialsUpper = initials.toUpperCase();
                        return (
                          <>
                            {(tenant?.business_profile?.logo_url || tenant?.logo_url) ? (
                              <img src={tenant?.business_profile?.logo_url || tenant?.logo_url!} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                                {initialsUpper}
                              </span>
                            )}
                            <span className="hidden text-left leading-tight lg:block">
                              <span className="block text-xs text-gray-500">{nameParts[0] || displayName}</span>
                              <span className="text-xs capitalize">{tenant?.plan ?? "trial"}</span>
                            </span>
                          </>
                        );
                      })()}
                      <ChevronDownIcon
                        className={cn("w-4 h-4 text-gray-400 transition-transform", isProfileMenuOpen && "rotate-180")}
                        aria-hidden
                      />
                    </button>
                    {isProfileMenuOpen ? (
                      <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                        <Link
                          href="/app/settings"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/app/settings/billing"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent"
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
          <main className="flex-1 px-4 pb-8 pt-6 lg:px-6">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}

