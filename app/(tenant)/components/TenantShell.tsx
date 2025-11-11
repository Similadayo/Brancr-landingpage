'use client';

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useTenant } from "../providers/TenantProvider";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/app", icon: "🏠" },
  { label: "Inbox", href: "/app/inbox", icon: "💬" },
  { label: "Campaigns", href: "/app/campaigns", icon: "🚀" },
  { label: "Onboarding", href: "/app/onboarding", icon: "🎯" },
  { label: "Integrations", href: "/app/integrations", icon: "🔗" },
  { label: "Analytics", href: "/app/analytics", icon: "📊" },
  { label: "Settings", href: "/app/settings", icon: "⚙️" },
];

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

  const currentNav = useMemo(() => {
    const matched = NAV_ITEMS.reduce<NavItem | undefined>((best, item) => {
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

    return matched ?? NAV_ITEMS[0];
  }, [pathname]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
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
            className="mt-6 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
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

function renderNavItems(compact: boolean) {
    return (
      <nav className="mt-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileNavOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-base transition group-hover:bg-primary/10 group-hover:text-primary",
                isActive && "bg-primary text-white group-hover:bg-primary"
              )}
              aria-hidden
            >
              {item.icon}
            </span>
            {!compact ? (
              <>
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-gray-400 group-hover:text-primary" aria-hidden>
                  {isActive ? "•" : "→"}
                </span>
              </>
            ) : null}
          </Link>
        );
        })}
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
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-gray-200 bg-white px-6 py-8 shadow-2xl transition-transform lg:hidden",
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
            ✕
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
              Manage plan <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Account</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
                <p className="text-xs text-gray-500">{tenant.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
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
            "sticky top-0 hidden h-screen shrink-0 border-r border-gray-200 bg-white/80 px-4 py-8 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col"
          )}
          style={{ width: sidebarDesktopWidth }}
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
                    Manage plan <span aria-hidden>↗</span>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-500">{tenant.email}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-600">Account</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="mt-auto flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-500 transition hover:border-primary hover:text-primary"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? "⟩" : "⟨"}
          </button>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-20 items-center border-b border-gray-200 bg-white/70 px-4 backdrop-blur lg:px-8">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-primary hover:text-primary lg:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Current view</p>
                  <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">{currentNav?.label ?? "Dashboard"}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm lg:flex">
                  Status:
                  <span
                    className={cn(
                      "ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      tenant.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : tenant.status === "trial"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {tenant.status}
                  </span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 pb-16 pt-10 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

