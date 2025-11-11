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
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/app" },
  { label: "Inbox", href: "/app/inbox" },
  { label: "Campaigns", href: "/app/campaigns" },
  { label: "Integrations", href: "/app/integrations" },
  { label: "Analytics", href: "/app/analytics" },
  { label: "Settings", href: "/app/settings" },
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

  const currentNav = useMemo(
    () => NAV_ITEMS.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)),
    [pathname]
  );

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

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200 bg-white px-6 py-8 shadow-xl shadow-primary/5 transition-transform lg:static lg:translate-x-0",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Navigate</p>
              <nav className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition",
                        isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {item.label}
                      {isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      ) : (
                        <span aria-hidden>→</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-primary/10 to-transparent px-5 py-4 text-sm text-gray-600">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Plan</p>
              <p className="mt-2 text-base font-semibold text-gray-900">{tenant.plan ?? "trial"}</p>
              <p className="mt-2 text-xs text-gray-500">
                Track usage, upgrade your plan, and manage billing from settings.
              </p>
              <Link
                href="/app/settings/billing"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
              >
                Manage plan <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>

          <div className="mt-auto border-t border-gray-200 pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Account</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
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
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen w-full flex-col lg:pl-72">
          <header className="sticky top-0 z-30 flex h-20 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-8">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((prev) => !prev)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-primary hover:text-primary lg:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Current view</p>
                  <h2 className="text-lg font-semibold text-gray-900">{currentNav?.label ?? "Dashboard"}</h2>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">
                  Status:{" "}
                  <span
                    className={cn(
                      "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
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

          <main className="flex-1 px-4 pb-16 pt-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

