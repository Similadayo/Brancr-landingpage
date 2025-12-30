'use client';

import { useMemo, useState, useEffect } from "react";
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
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load escalations</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error.message}</p>
        </div>
      ) : filteredEscalations.length === 0 ? (
        <div className="card p-12 text-center sm:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <AlertIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No escalations found</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
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
  const priorityColors: Record<string, string> = {
    critical: 'border-l-4 border-red-500 bg-red-50/30 dark:bg-red-900/10',
    urgent: 'border-l-4 border-orange-500 bg-orange-50/30 dark:bg-orange-900/10',
    high: 'border-l-4 border-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10',
    normal: 'border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10',
    low: 'border-l-4 border-gray-300 bg-gray-50/30 dark:bg-gray-700/30',
  };

  const confidenceColor = escalation.confidence >= 0.9 
    ? 'text-green-600 dark:text-green-400' 
    : escalation.confidence >= 0.7 
    ? 'text-yellow-600 dark:text-yellow-400' 
    : 'text-orange-600 dark:text-orange-400';

  return (
    <Link
      href={`/app/escalations/${escalation.id}`}
      className={`card group relative overflow-hidden p-5 transition-all hover:shadow-lg hover:border-primary/20 sm:p-6 ${priorityColors[escalation.priority] ?? priorityColors.normal}`}
    >
      <div className="flex items-start gap-4">
            {/* Avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-base font-bold text-white shadow-md ring-2 ring-white dark:ring-gray-800">
              {escalation.customerName.charAt(0).toUpperCase()}
            </div>
            
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Row: Name, Priority, Time */}
          <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {escalation.customerName}
                    </h3>
                    {escalation.customerUsername && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                        @{escalation.customerUsername}
                      </span>
                    )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`badge ${PLATFORM_BADGES[escalation.platform.toLowerCase()] ?? "badge-gray"} text-xs font-medium`}>
                  {escalation.platform}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(escalation.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`badge ${PRIORITY_BADGES[escalation.priority] ?? "badge-gray"} text-xs font-bold px-3 py-1`}>
                {escalation.priority.toUpperCase()}
              </span>
              <span className={`text-xs font-semibold ${confidenceColor} whitespace-nowrap`}>
                {Math.round(escalation.confidence * 100)}%
                </span>
            </div>
              </div>

          {/* Message Preview */}
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-3">
                  {escalation.message}
                </p>
              </div>

          {/* Intent and Tone - Better Styled */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Intent:</span>
              <span className="inline-flex items-center rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-white">
                {escalation.intent}
                </span>
              </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tone:</span>
              <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
                escalation.tone.toLowerCase() === 'negative' 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-white'
                  : escalation.tone.toLowerCase() === 'positive'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {escalation.tone}
              </span>
            </div>
          </div>
        </div>
        
        {/* Arrow indicator */}
        <div className="flex shrink-0 items-center pt-1">
          <ArrowRightIcon className="h-6 w-6 text-gray-400 transition-all group-hover:text-primary group-hover:translate-x-1 dark:text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
