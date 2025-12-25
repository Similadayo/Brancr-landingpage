'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useEscalations, useEscalationStats, type Escalation } from "@/app/(tenant)/hooks/useEscalations";
import {
  AlertIcon,
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from "../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";

const PRIORITY_BADGES: Record<string, string> = {
  low: "badge-gray",
  normal: "badge-info",
  high: "badge-warning",
  urgent: "badge-error",
  critical: "badge-error",
};

const PLATFORM_BADGES: Record<string, string> = {
  instagram: "badge-info",
  facebook: "badge-info",
  whatsapp: "badge-success",
  tiktok: "badge-gray",
  telegram: "badge-info",
  email: "badge-gray",
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter by platform and search (client-side)
  const filteredEscalations = useMemo(() => {
    let filtered = [...escalations];
    
    if (platformFilter !== "all") {
      filtered = filtered.filter((e) => e.platform.toLowerCase() === platformFilter.toLowerCase());
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.customerName.toLowerCase().includes(query) ||
          e.customerUsername?.toLowerCase().includes(query) ||
          e.message.toLowerCase().includes(query) ||
          e.intent.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "priority") {
      const priorityOrder: Record<string, number> = { critical: 5, urgent: 4, high: 3, normal: 2, low: 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0));
    }
    return filtered;
  }, [escalations, platformFilter, sortBy, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-md sm:h-12 sm:w-12">
            <AlertIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Escalations</h1>
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Review and respond to customer escalations that require your attention
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border-2 border-error-200 bg-error-50 px-4 py-2.5 dark:border-error-800 dark:bg-error-900/20">
            <div className="h-2.5 w-2.5 rounded-full bg-error-500 animate-pulse" />
            <span className="text-sm font-bold text-error-700 dark:text-error-400">{pendingCount} Pending</span>
          </div>
        )}
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="stat-card group">
            <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-info-400/20 to-info-500/20 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Total</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{stats.total}</p>
            </div>
          </div>
          <div className="stat-card group">
            <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-warning-400/20 to-warning-500/20 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Pending</p>
              <p className="mt-2 text-2xl font-bold text-warning-600 dark:text-warning-400 sm:text-3xl">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card group">
            <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-success-400/20 to-success-500/20 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Resolved</p>
              <p className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400 sm:text-3xl">{stats.resolved}</p>
            </div>
          </div>
          <div className="stat-card group col-span-2 lg:col-span-1">
            <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-accent-400/20 to-accent-500/20 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Avg Response</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl lg:text-2xl">{stats.avgResponseTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Search and Filter Section */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="search-bar flex-1 sm:max-w-md lg:max-w-lg">
            <MagnifyingGlassIcon className="input-icon" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, username, or message..."
              className="search-input"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <FunnelIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              <div className="flex-1 sm:flex-none sm:min-w-[140px]">
                <Select
                  value={priorityFilter}
                  onChange={(value) => setPriorityFilter(value || 'all')}
                  searchable={false}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'high', label: 'High' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>
              <div className="flex-1 sm:flex-none sm:min-w-[140px]">
                <Select
                  value={platformFilter}
                  onChange={(value) => setPlatformFilter(value || 'all')}
                  searchable={false}
                  options={[
                    { value: 'all', label: 'All Platforms' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'facebook', label: 'Facebook' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'telegram', label: 'Telegram' },
                  ]}
                />
              </div>
              <div className="flex-1 sm:flex-none sm:min-w-[140px]">
                <Select
                  value={sortBy}
                  onChange={(value) => setSortBy((value || 'newest') as 'newest' | 'priority')}
                  searchable={false}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'priority', label: 'By Priority' },
                  ]}
                />
              </div>
            </div>
            {(searchQuery || priorityFilter !== "all" || platformFilter !== "all") && (
              <button
                onClick={() => {
                  setPriorityFilter("all");
                  setPlatformFilter("all");
                  setSearchQuery("");
                }}
                className="btn-ghost text-xs sm:text-sm w-full sm:w-auto"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Escalations List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
            <AlertIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load escalations</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      ) : filteredEscalations.length === 0 ? (
        <div className="card p-12 text-center sm:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <AlertIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No escalations found</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || priorityFilter !== "all" || platformFilter !== "all"
              ? "Try adjusting your search or filters"
              : "All escalations have been handled"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEscalations.map((escalation) => (
            <EscalationCard key={escalation.id} escalation={escalation} />
          ))}
        </div>
      )}
    </div>
  );
}

function EscalationCard({ escalation }: { escalation: Escalation }) {
  return (
    <Link
      href={`/app/escalations/${escalation.id}`}
      className="card group p-5 transition-all hover:shadow-lg sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-sm font-semibold text-white shadow-md sm:h-12 sm:w-12">
              {escalation.customerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">{escalation.customerName}</h3>
                {escalation.customerUsername && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">@{escalation.customerUsername}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`badge ${PLATFORM_BADGES[escalation.platform.toLowerCase()] ?? "badge-gray"} text-[10px]`}>
                  {escalation.platform}
                </span>
                <span className={`badge ${PRIORITY_BADGES[escalation.priority] ?? "badge-gray"} text-[10px]`}>
                  {escalation.priority}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {escalation.intent} • {escalation.tone}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{escalation.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>AI Confidence: <span className="font-semibold">{Math.round(escalation.confidence * 100)}%</span></span>
                <span>•</span>
                <span>{formatTimeAgo(escalation.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ArrowRightIcon className="h-5 w-5 text-gray-400 transition-transform group-hover:text-accent group-hover:translate-x-1 dark:text-gray-500" />
        </div>
      </div>
    </Link>
  );
}
