'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledPosts, useCancelScheduledPost, useUpdateScheduledPost, useCampaignStats } from "@/app/(tenant)/hooks/useScheduledPosts";
import { tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, ErrorMessages } from "@/lib/error-messages";
import { useTemplates } from "@/app/(tenant)/hooks/useTemplates";
import {
  RocketIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ImageIcon,
  XIcon,
} from "../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";

type Tab = "scheduled" | "published" | "drafts";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  posting: "bg-amber-100 text-amber-700 border-amber-200",
  posted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("scheduled");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: campaignStats } = useCampaignStats();
  const { data: templatesData } = useTemplates();
  
  // Determine API status filter based on active tab
  // For scheduled tab, we need to fetch all posts and filter client-side
  // because the API might return posts with different statuses
  const apiStatusFilter = useMemo(() => {
    switch (activeTab) {
      case "scheduled":
        // Fetch all posts - we'll filter client-side for "scheduled" and "posting"
        return undefined;
      case "published":
        return "posted";
      case "drafts":
        return "draft";
      default:
        return undefined;
    }
  }, [activeTab]);

  // Fetch posts with API filtering
  const { data: scheduledPostsData, isLoading, error, refetch } = useScheduledPosts(
    apiStatusFilter ? { status: apiStatusFilter } : undefined
  );
  
  const scheduledPosts = useMemo(
    () => Array.isArray(scheduledPostsData) ? scheduledPostsData : [],
    [scheduledPostsData]
  );
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const cancelMutation = useCancelScheduledPost();
  const [cancellingPostId, setCancellingPostId] = useState<string | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const updateMutation = useUpdateScheduledPost();

  // Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState<string>("");
  const [editScheduledAt, setEditScheduledAt] = useState<string>("");

  // Filter posts (client-side for status filter, platform filter, and search)
  const currentPosts = useMemo(() => {
    let posts = [...scheduledPosts];
    
    console.log('[CampaignsPage] Filtering posts - initial:', {
      count: posts.length,
      posts: posts.map(p => ({ id: p.id, name: p.name, status: p.status })),
      activeTab,
      statusFilter,
    });

    // For scheduled tab, filter to show only "scheduled" and "posting" status posts
    if (activeTab === "scheduled") {
      const beforeCount = posts.length;
      posts = posts.filter((post) => {
        const isScheduled = post.status === "scheduled" || post.status === "posting";
        if (!isScheduled) {
          console.log('[CampaignsPage] Filtered out (not scheduled/posting):', { id: post.id, status: post.status, name: post.name });
        }
        return isScheduled;
      });
      console.log('[CampaignsPage] After scheduled tab filter:', { before: beforeCount, after: posts.length });
    }

    // Apply status filter (additional filtering beyond API)
    if (statusFilter !== "All") {
      const beforeCount = posts.length;
      posts = posts.filter((post) => {
        const matches = post.status === statusFilter.toLowerCase();
        if (!matches) {
          console.log('[CampaignsPage] Filtered out (status filter):', { id: post.id, status: post.status, filter: statusFilter });
        }
        return matches;
      });
      console.log('[CampaignsPage] After status filter:', { before: beforeCount, after: posts.length, filter: statusFilter });
    }

    // Apply platform filter
    if (platformFilter !== "All") {
      posts = posts.filter((post) =>
        post.platforms.some((p) => p.toLowerCase() === platformFilter.toLowerCase())
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.name.toLowerCase().includes(query) ||
          post.caption?.toLowerCase().includes(query) ||
          post.platforms.some((p) => p.toLowerCase().includes(query))
      );
    }

    // Sort by scheduled date (newest first for published, oldest first for scheduled)
    return posts.sort((a, b) => {
      if (activeTab === "published") {
        const aTime = a.posted_at || a.scheduled_at || "";
        const bTime = b.posted_at || b.scheduled_at || "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }
      const aTime = a.scheduled_at || "";
      const bTime = b.scheduled_at || "";
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
  }, [scheduledPosts, activeTab, statusFilter, platformFilter, searchQuery]);

  // Debug logging
  useEffect(() => {
    console.log('[CampaignsPage] Debug:', {
      activeTab,
      apiStatusFilter,
      scheduledPostsCount: scheduledPosts.length,
      campaignStatsScheduled: campaignStats?.scheduled,
      statusFilter,
      platformFilter,
      searchQuery,
      currentPostsCount: currentPosts.length,
      scheduledPosts: scheduledPosts.map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status, 
        platforms: p.platforms,
        scheduled_at: p.scheduled_at 
      })),
      currentPosts: currentPosts.map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status 
      })),
      rawData: scheduledPostsData,
    });
  }, [activeTab, apiStatusFilter, scheduledPosts, campaignStats, statusFilter, platformFilter, searchQuery, currentPosts, scheduledPostsData]);

  const handleCancel = (postId: string, postName: string) => {
    if (confirm(`Are you sure you want to cancel "${postName}"? This cannot be undone.`)) {
      setCancellingPostId(postId);
      cancelMutation.mutate(postId, {
        onSettled: () => {
          setCancellingPostId(null);
        },
      });
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      setPublishingPostId(postId);
      await tenantApi.publishPost(postId);
      toast.success("Post is being published now!");
      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["scheduled-post", postId] });
    } catch (error: any) {
      const errorMessage = error?.body?.message || error?.message || "Failed to publish post";
      toast.error(errorMessage);
    } finally {
      setPublishingPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RocketIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Posts & Campaigns</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Manage scheduled posts, published content, and drafts
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105"
          >
            <PlusIcon className="w-4 h-4" />
            Create Post
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "scheduled"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          Scheduled ({campaignStats?.scheduled ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "published"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          Published ({campaignStats?.published ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "drafts"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          Drafts ({campaignStats?.draft ?? 0})
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by name, caption, or platform..."
            aria-label="Search posts"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          {activeTab === "scheduled" && (
            <div className="w-40">
              <Select
                value={statusFilter as 'All' | 'scheduled' | 'posting'}
                onChange={(value) => setStatusFilter((value || 'All') as any)}
                searchable={false}
                buttonClassName="px-3 py-2.5 text-sm rounded-lg"
                options={[
                  { value: 'All', label: 'All Status' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'posting', label: 'Posting' },
                ]}
              />
            </div>
          )}
          <div className="w-44">
            <Select
              value={platformFilter as any}
              onChange={(value) => setPlatformFilter((value || 'All') as any)}
              searchable={false}
              buttonClassName="px-3 py-2.5 text-sm rounded-lg"
              options={[
                { value: 'All', label: 'All Platforms' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'telegram', label: 'Telegram' },
                { value: 'youtube', label: 'YouTube' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-rose-400" />
            <p className="mt-3 text-sm font-semibold text-rose-900">
              {getUserFriendlyErrorMessage(error, {
                action: 'loading posts',
                resource: 'posts',
              }) || 'Failed to load posts'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs text-rose-700 hover:text-rose-900 underline"
            >
              Refresh page
            </button>
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            {activeTab === "scheduled" && <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />}
            {activeTab === "published" && <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />}
            {activeTab === "drafts" && <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />}
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {activeTab === "scheduled" && "No scheduled posts"}
              {activeTab === "published" && "No published posts"}
              {activeTab === "drafts" && "No drafts"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {activeTab === "scheduled" && "Create your first scheduled post to get started"}
              {activeTab === "published" && "Published posts will appear here"}
              {activeTab === "drafts" && "Draft posts will appear here"}
            </p>
            {activeTab === "scheduled" && (
              <Link
                href="/app/posts/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
              >
                <PlusIcon className="w-4 h-4" />
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentPosts.map((post) => {
              const canCancel = post.status === "scheduled" || post.status === "posting";
              const canPublish = post.status === "scheduled";
              const isCancelling = cancellingPostId === post.id;
              const isPublishing = publishingPostId === post.id;

              return (
                <div key={post.id} className="p-5 transition hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Media Preview Placeholder */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>

                    {/* Post Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">{post.name}</h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                STATUS_STYLES[post.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="line-clamp-2 text-sm text-gray-600 flex-1">{post.caption || "No caption"}</p>
                            {post.enhance_caption && (
                              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                ✨ AI Enhanced
                              </span>
                            )}
                            {!post.caption && (
                              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                🤖 AI Generated
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap gap-1">
                              {post.platforms.map((platform) => {
                                const isTikTok = platform.toLowerCase() === 'tiktok';
                                return (
                                  <span
                                    key={platform}
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                      isTikTok
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {isTikTok ? '🎵' : ''} {platform}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {activeTab === "published" && post.posted_at
                                ? new Date(post.posted_at || post.scheduled_at || post.created_at).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : new Date(post.scheduled_at || post.created_at).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                            </span>
                          </div>
                          {post.last_error && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                              <XCircleIcon className="h-4 w-4 text-rose-600" />
                              <p className="text-xs font-medium text-rose-900">Error: {post.last_error}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/app/campaigns/${post.id}`}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            View
                          </Link>
                          {canPublish && (
                            <button
                              onClick={() => void handlePublishNow(post.id)}
                              disabled={isPublishing}
                              className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                            >
                              {isPublishing ? (
                                <>
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-600/20 border-t-green-600" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="h-3.5 w-3.5" />
                                  Publish Now
                                </>
                              )}
                            </button>
                          )}
                          {canCancel && (
                            <>
                              <button
                                onClick={() => {
                                  setEditPostId(post.id);
                                  setEditCaption(post.caption || "");
                                  const dt = new Date(post.scheduled_at || post.created_at);
                                  const tzOffset = dt.getTimezoneOffset() * 60000;
                                  const localISO = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
                                  setEditScheduledAt(localISO);
                                  setIsEditOpen(true);
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancel(post.id, post.name)}
                                disabled={isCancelling || cancelMutation.isPending}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {isCancelling ? (
                                  <>
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600/20 border-t-red-600" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <TrashIcon className="h-3.5 w-3.5" />
                                    Cancel
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Reschedule Modal */}
      {isEditOpen && editPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Scheduled Post</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Update the caption..."
                />
              </div>

              <div>
                <label htmlFor="edit-scheduled-time" className="block text-sm font-semibold text-gray-900 mb-2">Scheduled Time</label>
                <input
                  id="edit-scheduled-time"
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                  aria-label="Scheduled time"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-2 text-xs text-gray-500">Times are saved in your local timezone.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  let iso: string | undefined = undefined;
                  if (editScheduledAt) {
                    const local = new Date(editScheduledAt);
                    iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
                  }
                  updateMutation.mutate(
                    {
                      postId: editPostId,
                      payload: {
                        caption: editCaption.trim() || undefined,
                        scheduled_at: iso,
                      },
                    },
                    {
                      onSuccess: () => {
                        setIsEditOpen(false);
                      },
                    }
                  );
                }}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
