'use client';

import { useMemo, useState } from "react";
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
import ConfirmModal from '@/app/components/ConfirmModal';
import Select from "@/app/(tenant)/components/ui/Select";
import { StatusBadge } from "@/app/(tenant)/components/ui/Badge";
import { Button } from "@/app/(tenant)/components/ui/Button";
import { Card } from "@/app/(tenant)/components/ui/Card";
import { Pagination } from "@/app/(tenant)/components/ui/Pagination";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


type Tab = "scheduled" | "published" | "drafts";

// Status styles now handled by StatusBadge component

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("scheduled");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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

    // For scheduled tab, filter to show only "scheduled" and "posting" status posts
    if (activeTab === "scheduled") {
      const beforeCount = posts.length;
      posts = posts.filter((post) => {
        const isScheduled = post.status === "scheduled" || post.status === "posting";
        return isScheduled;
      });
      void beforeCount;
    }

    // Apply status filter (additional filtering beyond API)
    if (statusFilter !== "All") {
      const beforeCount = posts.length;
      posts = posts.filter((post) => {
        const matches = post.status === statusFilter.toLowerCase();
        return matches;
      });
      void beforeCount;
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

  // Pagination
  const totalPages = Math.ceil(currentPosts.length / itemsPerPage);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return currentPosts.slice(start, start + itemsPerPage);
  }, [currentPosts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, platformFilter, searchQuery]);

  void scheduledPostsData;

  const [showCancelPostId, setShowCancelPostId] = useState<string | null>(null);
  const [showCancelPostName, setShowCancelPostName] = useState<string | null>(null);

  const handleCancel = (postId: string, postName: string) => {
    setShowCancelPostId(postId);
    setShowCancelPostName(postName);
  };

  const confirmCancelPost = (postId: string) => {
    setCancellingPostId(postId);
    cancelMutation.mutate(postId, {
      onSettled: () => {
        setCancellingPostId(null);
      },
    });
    setShowCancelPostId(null);
    setShowCancelPostName(null);
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

  const router = useRouter();

  function DraftsList() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        setLoadingDrafts(true);
        try {
          const res: any = await tenantApi.getDrafts('compose.post');
          const serverList = (res?.drafts || []).slice();

          // Try to include a local snapshot (compose.post) as a local-only draft when present
          try {
            const raw = localStorage.getItem('drafts-local-compose.post');
            if (raw) {
              const snap = JSON.parse(raw);
              if (snap && snap.content) {
                // Build a synthetic draft object for display. If there is a matching server draft id, skip adding.
                const localId = snap.draftId || `local-${snap.updatedAt || Date.now()}`;
                const already = serverList.find((d: any) => d.id === localId);
                if (!already) {
                  serverList.push({
                    id: localId,
                    key: 'compose.post',
                    content: snap.content,
                    metadata: snap.metadata,
                    owner_id: undefined,
                    created_at: snap.updatedAt ? new Date(snap.updatedAt).toISOString() : new Date().toISOString(),
                    updated_at: snap.updatedAt ? new Date(snap.updatedAt).toISOString() : new Date().toISOString(),
                    _local_only: true,
                    _local_snapshot: snap,
                  });
                }
              }
            }
          } catch (e) {
            // ignore local snapshot parsing errors
          }

          const list = serverList.slice().sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          if (mounted) setDrafts(list);
        } catch (e) {
          console.error('Failed to load drafts:', e);
        } finally {
          if (mounted) setLoadingDrafts(false);
        }
      })();
      return () => { mounted = false; };
    }, []);

    const handleRestore = async (id: string, draft: any) => {
      try {
        if (draft && draft._local_only) {
          // Local-only snapshot: restore from snapshot content
          const content = draft.content || draft._local_snapshot?.content;
          localStorage.setItem('post-draft', JSON.stringify(content));
          toast.success('Draft restored — opening composer');
          router.push('/app/posts/new');
          return;
        }
        const res: any = await tenantApi.getDraft(id);
        const content = res.content;
        // Save to local snapshot for compose page to pick up
        localStorage.setItem('post-draft', JSON.stringify(content));
        toast.success('Draft restored — opening composer');
        router.push('/app/posts/new');
      } catch (e) {
        toast.error('Failed to restore draft');
      }
    };

    const handleDelete = async (id: string, draft: any) => {
      setDeletingId(id);
      try {
        if (draft && draft._local_only) {
          // Clear local snapshot
          try {
            localStorage.removeItem('drafts-local-compose.post');
          } catch (e) {
            // ignore
          }
          setDrafts((prev) => prev.filter((d) => d.id !== id));
          toast.success('Draft removed');
          setDeletingId(null);
          return;
        }

        await tenantApi.deleteDraft(id);
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        toast.success('Draft deleted');
      } catch (e) {
        toast.error('Failed to delete draft');
      } finally {
        setDeletingId(null);
      }
    };

    if (loadingDrafts) return <div className="p-4 text-sm text-gray-500">Loading drafts…</div>;
    if (drafts.length === 0) return <div className="p-4 text-sm text-gray-500">No drafts found.</div>;

    return (
      <div className="p-4">
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">Saved {new Date(d.updated_at).toLocaleString()} {d._local_only ? <span className="ml-2 text-xs font-medium text-amber-600">(Saved locally)</span> : null}</div>
                <div className="mt-1 text-xs text-gray-600 line-clamp-2">{d.content?.caption ? d.content.caption.split('\n')[0].slice(0,200) : '(no caption)'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => void handleRestore(d.id, d)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100">Restore</button>
                <button onClick={() => void handleDelete(d.id, d)} disabled={deletingId === d.id} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">{deletingId===d.id ? 'Deleting…' : 'Delete'}</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {showCancelPostId && (
        <ConfirmModal
          open={true}
          title="Cancel post"
          description={`Are you sure you want to cancel "${showCancelPostName}"? This cannot be undone.`}
          confirmText="Cancel post"
          onConfirm={() => { if (showCancelPostId) confirmCancelPost(showCancelPostId); }}
          onCancel={() => { setShowCancelPostId(null); setShowCancelPostName(null); }}
        />
      )}
      
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-accent via-accent/95 to-accent/90 p-6 shadow-xl dark:border-gray-600 dark:from-accent dark:via-accent/90 dark:to-accent/80 sm:p-8 md:p-10">
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
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <RocketIcon className="h-5 w-5 text-white/90 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl lg:text-4xl">Posts & Campaigns</h1>
              </div>
              <p className="text-xs text-white/90 sm:text-sm md:text-base lg:text-lg max-w-2xl">
                Manage scheduled posts, published content, and drafts all in one place
              </p>
            </div>
            <Link 
              href="/app/posts/new" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-accent shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:px-5 sm:py-3 sm:text-sm md:px-6 md:py-3.5"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Post</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-600 dark:bg-gray-700">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "scheduled"
                ? "bg-accent text-white shadow-md dark:bg-white dark:text-gray-100"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            Scheduled
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "scheduled" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
            }`}>
              {campaignStats?.scheduled ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "published"
                ? "bg-accent text-white shadow-md dark:bg-white dark:text-gray-100"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Published
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "published" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
            }`}>
              {campaignStats?.published ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "drafts"
                ? "bg-accent text-white shadow-md dark:bg-white dark:text-gray-100"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Drafts
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "drafts" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
            }`}>
              {campaignStats?.draft ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* Modern Search and Filter Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-md lg:max-w-lg">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by name, caption, or platform..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-accent dark:focus:bg-gray-600"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <FunnelIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-400" />
              {activeTab === "scheduled" && (
                <div className="flex-1 sm:flex-none sm:min-w-[160px]">
                  <Select
                    value={statusFilter as 'All' | 'scheduled' | 'posting'}
                    onChange={(value) => setStatusFilter((value || 'All') as any)}
                    searchable={false}
                    options={[
                      { value: 'All', label: 'All Status' },
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'posting', label: 'Posting' },
                    ]}
                  />
                </div>
              )}
              <div className="flex-1 sm:flex-none sm:min-w-[180px]">
                <Select
                  value={platformFilter as any}
                  onChange={(value) => setPlatformFilter((value || 'All') as any)}
                  searchable={false}
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
            {(searchQuery || statusFilter !== "All" || platformFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setPlatformFilter("All");
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
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
        ) : activeTab === 'drafts' ? (
          <DraftsList />
        ) : currentPosts.length === 0 ? (
          <div className="card p-12 text-center sm:p-16">
            {activeTab === "scheduled" && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
              </div>
            )}
            {activeTab === "published" && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <CheckCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
              </div>
            )}
            {String(activeTab) === "drafts" && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
              </div>
            )}
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {activeTab === "scheduled" && "No scheduled posts"}
              {activeTab === "published" && "No published posts"}
              {String(activeTab) === "drafts" && "No drafts"}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {activeTab === "scheduled" && "Create your first scheduled post to get started"}
              {activeTab === "published" && "Published posts will appear here"}
              {String(activeTab) === "drafts" && "Draft posts will appear here"}
            </p>
            {activeTab === "scheduled" && (
              <Link href="/app/posts/new" className="btn-primary mt-6">
                <PlusIcon className="w-4 h-4" />
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPosts.map((post) => {
              const canCancel = post.status === "scheduled" || post.status === "posting";
              const canPublish = post.status === "scheduled";
              const isCancelling = cancellingPostId === post.id;
              const isPublishing = publishingPostId === post.id;

              return (
                <div key={post.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-accent/50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Media Preview Placeholder */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-600 dark:from-gray-700 dark:to-gray-800">
                      <ImageIcon className="h-7 w-7 text-gray-400 dark:text-gray-400" />
                    </div>

                    {/* Post Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">{post.name}</h3>
                            <StatusBadge status={post.status}>
                              {post.status}
                            </StatusBadge>
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
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={currentPosts.length}
              />
            </div>
          )}
        )}
      </div>

      {/* Edit / Reschedule Modal */}
      {isEditOpen && editPostId && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content animate-scale-in w-full max-w-lg mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Scheduled Post</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="btn-secondary"
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
                className="btn-primary"
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
