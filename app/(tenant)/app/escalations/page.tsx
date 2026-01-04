'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEscalations, useEscalationStats, type Escalation } from "@/app/(tenant)/hooks/useEscalations";
import { tenantApi } from "@/lib/api";
import {
  AlertIcon,
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  TagIcon,
} from "../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";
import { Pagination } from "@/app/(tenant)/components/ui/Pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Pagination
  const totalPages = Math.ceil(filteredEscalations.length / itemsPerPage);
  const paginatedEscalations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEscalations.slice(start, start + itemsPerPage);
  }, [filteredEscalations, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, platformFilter, sortBy, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-warning-600 via-warning-600/95 to-warning-700/90 p-6 shadow-xl dark:border-gray-600 dark:from-warning-600 dark:via-warning-600/90 dark:to-warning-700/80 sm:p-8 md:p-10">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:mb-3">
            <div className="flex items-center gap-3">
              <AlertIcon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Escalations</h1>
            </div>
            {pendingCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/25 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold text-white sm:text-sm">{pendingCount} Pending</span>
              </div>
            )}
          </div>
          <p className="text-sm text-white sm:text-base md:text-lg max-w-2xl">
            Review and respond to customer escalations that require your attention
          </p>
        </div>
      </div>

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
              <p className="mt-2 text-2xl font-bold text-warning-600 dark:text-warning-300 sm:text-3xl">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card group">
            <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-success-400/20 to-success-500/20 blur-2xl transition-transform group-hover:scale-150" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Resolved</p>
              <p className="mt-2 text-2xl font-bold text-success-600 dark:text-success-300 sm:text-3xl">{stats.resolved}</p>
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
              <FunnelIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-400" />
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
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Failed to load escalations</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-white">{error.message}</p>
        </div>
      ) : filteredEscalations.length === 0 ? (
        <div className="card p-12 text-center sm:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <AlertIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No escalations found</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-white">
            {searchQuery || priorityFilter !== "all" || platformFilter !== "all"
              ? "Try adjusting your search or filters"
              : "All escalations have been handled"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedEscalations.map((escalation) => (
              <EscalationCard key={escalation.id} escalation={escalation} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredEscalations.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EscalationCard({ escalation }: { escalation: Escalation }) {
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: async () => {
      await tenantApi.resolveEscalation(escalation.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
      queryClient.invalidateQueries({ queryKey: ["escalation-stats"] });
    },
    onError: (err) => {
      console.error("Failed to resolve escalation", err);
    }
  });

  const handleResolve = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // In a real app, use a custom confirmation dialog
    if (confirm("Are you sure you want to mark this escalation as resolved?")) {
      setIsResolving(true);
      resolveMutation.mutate(undefined, {
        onSettled: () => setIsResolving(false)
      });
    }
  };

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-50 border-l-4 border-red-500 dark:bg-red-900/10',
    urgent: 'bg-orange-50 border-l-4 border-orange-500 dark:bg-orange-900/10',
    high: 'bg-yellow-50 border-l-4 border-yellow-500 dark:bg-yellow-900/10',
    normal: 'bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/10',
    low: 'bg-gray-50 border-l-4 border-gray-300 dark:bg-gray-800/50',
  };

  const confidenceColor = escalation.confidence >= 0.9
    ? 'text-green-600 dark:text-green-400'
    : escalation.confidence >= 0.7
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-orange-600 dark:text-orange-400';

  // Derived Reason Tags
  const tags = useMemo(() => {
    const t = [];
    if (escalation.priority === 'critical' || escalation.priority === 'urgent') t.push({ label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' });
    if (escalation.tone.toLowerCase() === 'negative') t.push({ label: 'Unhappy Customer', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' });
    if (escalation.intent.toLowerCase().includes('refund') || escalation.message.toLowerCase().includes('refund')) t.push({ label: 'Refund Request', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' });
    else if (escalation.intent.toLowerCase().includes('price') || escalation.intent.toLowerCase().includes('cost')) t.push({ label: 'Pricing Question', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' });
    if (escalation.confidence < 0.6) t.push({ label: 'Low Confidence', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' });
    return t;
  }, [escalation]);

  return (
    <Link
      href={`/app/escalations/${escalation.id}`}
      className={`group relative block rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px] dark:border-gray-700 ${priorityColors[escalation.priority] ?? priorityColors.normal}`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Avatar & Platform */}
          <div className="flex shrink-0 items-center gap-3 sm:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 font-bold text-lg text-primary">
              {escalation.customerName.charAt(0).toUpperCase()}
            </div>
            <div className="sm:mt-2 sm:text-center">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize 
                ${escalation.platform === 'whatsapp' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  escalation.platform === 'instagram' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-blue-100 text-blue-700'}`}>
                {escalation.platform}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {escalation.customerName}
                  {escalation.customerUsername && <span className="ml-2 text-sm font-normal text-gray-500">@{escalation.customerUsername}</span>}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${tag.color}`}>
                      <TagIcon className="h-3 w-3" />
                      {tag.label}
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 flex items-center gap-1 self-center ml-1">
                    <ClockIcon className="h-3 w-3" />
                    {formatTimeAgo(escalation.createdAt)}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-sm font-bold uppercase tracking-wider ${escalation.priority === 'critical' ? 'text-red-600' :
                  escalation.priority === 'urgent' ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                  {escalation.priority}
                </div>
                <div className={`text-xs font-medium ${confidenceColor}`}>
                  {(escalation.confidence * 100).toFixed(0)}% AI Confidence
                </div>
              </div>
            </div>

            {/* Message Snippet */}
            <div className="mt-3 relative rounded-lg bg-white/60 p-3 italic text-gray-700 ring-1 ring-gray-900/5 dark:bg-black/20 dark:text-gray-300 dark:ring-white/10">
              <span className="absolute -left-1 -top-2 text-2xl text-gray-300">&quot;</span>
              <p className="line-clamp-2 pl-2 text-sm">
                {escalation.message}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="mt-4 flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
              >
                {isResolving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
                Resolve Now
              </button>
              <span className="flex items-center text-sm font-medium text-primary hover:underline">
                View Details <ArrowRightIcon className="ml-1 h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
