'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useEscalations, useEscalationStats, type Escalation } from "@/app/(tenant)/hooks/useEscalations";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
  critical: "bg-purple-100 text-purple-700",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-fuchsia-100 text-fuchsia-700",
  facebook: "bg-blue-100 text-blue-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  tiktok: "bg-neutral-900 text-white",
  telegram: "bg-sky-100 text-sky-700",
  email: "bg-purple-100 text-purple-700",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function EscalationsPage() {
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priority">("newest");

  const apiParams = useMemo(() => {
    const params: { priority?: "low" | "normal" | "high" | "urgent" | "critical"; limit?: number } = { limit: 50 };
    if (priorityFilter !== "all") {
      params.priority = priorityFilter as "low" | "normal" | "high" | "urgent" | "critical";
    }
    return params;
  }, [priorityFilter]);

  const { data: escalationsData, isLoading, error } = useEscalations(apiParams);
  const { data: stats } = useEscalationStats();

  const escalations = escalationsData?.escalations ?? [];
  const pendingCount = stats?.pending ?? escalations.length;

  // Filter by platform (client-side since API doesn't support it yet)
  const filteredEscalations = useMemo(() => {
    let filtered = [...escalations];
    if (platformFilter !== "all") {
      filtered = filtered.filter((e) => e.platform.toLowerCase() === platformFilter.toLowerCase());
    }
    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "priority") {
      const priorityOrder: Record<string, number> = { critical: 5, urgent: 4, high: 3, normal: 2, low: 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0));
    }
    return filtered;
  }, [escalations, platformFilter, sortBy]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Escalations</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Review and respond to customer escalations that require your attention. AI-suggested replies are ready to approve or edit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {pendingCount} Pending
            </span>
          )}
        </div>
      </section>

      {/* Stats Widget */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Total</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Pending</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Resolved</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Avg Response</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{stats.avgResponseTime}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="tiktok">TikTok</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "priority")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="newest">Newest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Escalations List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
            Failed to load escalations: {error.message}
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-sm font-semibold text-gray-900">No escalations found</p>
            <p className="mt-2 text-xs text-gray-500">All escalations have been handled or match your filters.</p>
          </div>
        ) : (
          filteredEscalations.map((escalation) => (
            <EscalationCard key={escalation.id} escalation={escalation} />
          ))
        )}
      </div>
    </div>
  );
}

function EscalationCard({ escalation }: { escalation: Escalation }) {
  return (
    <Link
      href={`/app/escalations/${escalation.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {escalation.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{escalation.customerName}</h3>
                {escalation.customerUsername && (
                  <span className="text-xs text-gray-500">@{escalation.customerUsername}</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                    PLATFORM_COLORS[escalation.platform.toLowerCase()] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {escalation.platform}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                    PRIORITY_COLORS[escalation.priority] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {escalation.priority}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                  {escalation.intent} • {escalation.tone}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-gray-700">{escalation.message}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>AI Confidence: {Math.round(escalation.confidence * 100)}%</span>
            <span>•</span>
            <span>{formatTimeAgo(escalation.createdAt)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
            {formatTimeAgo(escalation.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

