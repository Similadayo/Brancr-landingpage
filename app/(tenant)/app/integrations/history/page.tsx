'use client';

import Link from "next/link";

const auditLogs = [
  {
    id: "log-001",
    action: "WhatsApp number assigned",
    timestamp: "Jul 6, 2025 • 09:18 AM",
    status: "success",
    details: "Successfully assigned WhatsApp Business number from Brancr pool",
  },
  {
    id: "log-002",
    action: "Instagram permissions pending approval",
    timestamp: "Jul 6, 2025 • 09:20 AM",
    status: "pending",
    details: "Waiting for Meta to approve Instagram messaging permissions",
  },
  {
    id: "log-003",
    action: "Webhook verification required",
    timestamp: "Jul 6, 2025 • 09:21 AM",
    status: "warning",
    details: "Meta webhook callback URL needs verification",
  },
  {
    id: "log-004",
    action: "Telegram bot connected",
    timestamp: "Jul 5, 2025 • 03:45 PM",
    status: "success",
    details: "Telegram bot successfully authenticated and connected",
  },
];

const statusStyles = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  warning: "bg-rose-100 text-rose-700 border-rose-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

export default function IntegrationHistoryPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-accent via-accent/95 to-accent/90 p-6 shadow-xl dark:border-gray-700 dark:from-accent-dark dark:via-accent-dark/95 dark:to-accent-dark/90 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href="/app/integrations"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white transition hover:border-white/50 hover:bg-white/20"
                  aria-label="Back to integrations"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Integration Audit Log</h1>
              </div>
              <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Track all integration events, connection changes, and authentication activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">{log.action}</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyles[log.status as keyof typeof statusStyles]
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{log.details}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            Real-time audit logs will display here once integrations are fully live.
          </p>
          <Link
            href="/app/integrations"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            Manage Integrations
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

