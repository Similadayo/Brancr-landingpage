'use client';

import Link from "next/link";
import { useRefreshSocialConnections, useSocialConnectionHistory, useSocialConnections } from "../../hooks/useSocialConnections";

const STATUS_MAP: Record<
  "connected" | "pending" | "action_required" | "not_connected",
  { label: string; badge: string; description: string }
> = {
  connected: {
    label: "Connected",
    badge: "bg-emerald-100 text-emerald-700",
    description: "All set. We’re syncing data and events.",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700",
    description: "Waiting for external approval. We’ll notify you once complete.",
  },
  action_required: {
    label: "Action required",
    badge: "bg-rose-100 text-rose-700",
    description: "Additional steps needed to finish the connection.",
  },
  not_connected: {
    label: "Not connected",
    badge: "bg-gray-100 text-gray-500",
    description: "Connect to unlock automations and analytics.",
  },
};

export default function IntegrationsPage() {
  const connectionsQuery = useSocialConnections();
  const historyQuery = useSocialConnectionHistory();
  const refreshMutation = useRefreshSocialConnections();

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Social & Messaging Connections</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Link Meta, TikTok, and Telegram accounts to automate content, messaging, and analytics in Brancr.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/integrations/history"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            View audit log
          </Link>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          >
            {refreshMutation.isPending ? "Refreshing…" : "Refresh status"}
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {connectionsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="h-4 w-32 rounded-full bg-gray-200" />
              <div className="mt-3 h-3 w-48 rounded-full bg-gray-200" />
            </div>
          ))
        ) : connectionsQuery.isError ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 md:col-span-2 xl:col-span-3">
            Unable to load integrations right now.
          </div>
        ) : (
          connectionsQuery.data?.map((card) => {
            const status = STATUS_MAP[card.status] ?? STATUS_MAP.not_connected;
            return (
              <div key={card.id} className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{card.platform}</h2>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${status.badge}`}>
                    {status.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{card.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">
                  {card.lastUpdated ?? "Never connected"}
                </p>
                <p className="mt-2 text-xs text-gray-500">{status.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary">
                    {card.status === "connected" ? "Repair connection" : "Connect"}
                  </button>
                  {card.platform.toLowerCase().includes("whatsapp") ? (
                    <button className="inline-flex items-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20">
                      Launch embedded signup
                    </button>
                  ) : null}
                  {card.platform.toLowerCase().includes("telegram") ? (
                    <a
                      href="https://t.me/brancrbot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                    >
                      Open bot deep link
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Meta setup checklist</h3>
          <p className="mt-2 text-xs text-gray-500">
            Complete all steps to enable full WhatsApp Business template access and message sending.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
              Connect Facebook Business Manager
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
              Approve Brancr app permissions (pages_messaging, whatsapp_business_messaging)
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">•</span>
              Submit WABA business verification
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">•</span>
              Configure webhook callback URL
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Connection history</h3>
          <p className="mt-2 text-xs text-gray-500">Track who initiated connections, embedded signup events, and error states.</p>
          <div className="mt-4 space-y-3 text-xs text-gray-600">
            {historyQuery.data?.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                <p className="font-semibold text-gray-900">{item.action}</p>
                <p className="mt-1 text-gray-500">{item.at}</p>
              </div>
            )) ?? (
              <div className="rounded-xl border border-dashed border-gray-200 p-3 text-center text-gray-500">
                No history recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

