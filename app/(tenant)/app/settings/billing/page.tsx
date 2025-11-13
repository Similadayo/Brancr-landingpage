'use client';

import Link from "next/link";
import { useTenant } from "@/app/(tenant)/providers/TenantProvider";

export default function BillingPage() {
  const { tenant } = useTenant();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Billing & Subscription</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Manage your subscription, billing details, and payment methods.
        </p>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p className="mt-2 text-sm text-gray-600">
              You are currently on the <span className="font-semibold capitalize">{tenant?.plan ?? "Trial"}</span> plan.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {tenant?.status ?? "Active"}
          </span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Plan</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">{tenant?.plan ?? "Trial"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">{tenant?.status ?? "Active"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Next Billing</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">--</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-semibold text-amber-900">Coming Soon</h3>
          <p className="mt-2 text-sm text-amber-700">
            Billing management features are currently in development. You&apos;ll be able to upgrade your plan, manage
            payment methods, and view invoices here soon.
          </p>
          <Link
            href="mailto:contact@brancr.com?subject=Billing%20Inquiry"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
          >
            Contact us about billing
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

