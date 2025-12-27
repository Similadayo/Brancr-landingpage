'use client';

import Link from "next/link";
import { useTenant } from "@/app/(tenant)/providers/TenantProvider";

export default function SupportPage() {
  const { tenant } = useTenant();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-700 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 dark:hidden" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 hidden dark:block" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Support & Help</h1>
              <p className="mt-2 text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Get help with your account, integrations, and platform features.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            📧
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Email Support</h2>
          <p className="mt-2 text-sm text-gray-600">
            Send us an email and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:contact@brancr.com?subject=Support Request"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Send Email
            <span aria-hidden>→</span>
          </a>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            💬
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">WhatsApp Support</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chat with our support team directly on WhatsApp for quick assistance.
          </p>
          <a
            href="https://wa.me/message/YOUR_WHATSAPP_NUMBER"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Open WhatsApp
            <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
            📚
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Documentation</h2>
          <p className="mt-2 text-sm text-gray-600">
            Browse our comprehensive guides and API documentation.
          </p>
          <Link
            href="/docs"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            View Docs
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            💡
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Feature Request</h2>
          <p className="mt-2 text-sm text-gray-600">
            Have an idea? Let us know what features you&apos;d like to see.
          </p>
          <a
            href="mailto:contact@brancr.com?subject=Feature Request"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Submit Idea
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Your Account Details</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Tenant Name</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{tenant?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{tenant?.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Plan</p>
            <p className="mt-1 text-sm font-medium capitalize text-gray-900">{tenant?.plan ?? "Trial"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</p>
            <p className="mt-1 text-sm font-medium capitalize text-gray-900">{tenant?.status ?? "Active"}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Include these details when contacting support for faster assistance.
        </p>
      </div>
    </div>
  );
}

