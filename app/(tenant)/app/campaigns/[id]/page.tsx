'use client';

import React from "react";
import Link from "next/link";
import { use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledPost, useCancelScheduledPost } from "@/app/(tenant)/hooks/useScheduledPosts";
import { tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  RocketIcon,
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PlayIcon,
  PencilIcon,
  ChartBarIcon,
  ImageIcon,
} from "../../../components/icons";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data: post, isLoading, error } = useScheduledPost(id);
  const cancelMutation = useCancelScheduledPost();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const handleCancel = () => {
    if (post && confirm(`Are you sure you want to cancel "${post.name}"? This cannot be undone.`)) {
      cancelMutation.mutate(id);
    }
  };

  const handlePublishNow = async () => {
    if (!post) return;
    try {
      setIsPublishing(true);
      await tenantApi.publishPost(id);
      toast.success("Post is being published now!");
      void queryClient.invalidateQueries({ queryKey: ["scheduled-post", id] });
      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    } catch (error: any) {
      const errorMessage = error?.body?.message || error?.message || "Failed to publish post";
      toast.error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Post Not Found</h1>
          <p className="mt-2 text-sm text-gray-600">
            The scheduled post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/app/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    posted: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircleIcon className="h-4 w-4" />,
    },
    scheduled: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <ClockIcon className="h-4 w-4" />,
    },
    posting: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <PlayIcon className="h-4 w-4" />,
    },
    failed: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <XCircleIcon className="h-4 w-4" />,
    },
    cancelled: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: <XCircleIcon className="h-4 w-4" />,
    },
  };

  const statusStyle = statusColors[post.status] || statusColors.cancelled;
  const canCancel = post.status === "scheduled" || post.status === "posting";
  const canPublish = post.status === "scheduled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/campaigns"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-primary hover:text-primary"
            aria-label="Back to campaigns"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">{post.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">
                Created {new Date(post.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {statusStyle.icon}
                {post.status}
              </span>
              {post.posted_at && (
                <span className="text-sm text-gray-500">
                  Posted {new Date(post.posted_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canPublish && (
            <button
              onClick={handlePublishNow}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-100 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600/20 border-t-green-600" />
                  Publishing...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Publish Now
                </>
              )}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50"
            >
              {cancelMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600/20 border-t-rose-600" />
                  Cancelling...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  Cancel Post
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Platforms</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{post.platforms?.length || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RocketIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Scheduled</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {new Date(post.scheduled_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(post.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Attempts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{post.attempts || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Media</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{post.media_asset_ids?.length || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Post Content</h2>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{post.caption || "No caption"}</p>
            </div>
          </section>

          {/* Media Preview */}
          {post.media_asset_ids && post.media_asset_ids.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Media</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {post.media_asset_ids.map((mediaId, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Error Details */}
          {post.last_error && (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircleIcon className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-semibold text-rose-900">Error Details</h3>
              </div>
              <p className="text-sm text-rose-700">{post.last_error}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platforms */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(post.platforms) && post.platforms.length > 0 ? (
                post.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 capitalize"
                  >
                    {platform}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No platforms</span>
              )}
            </div>
          </section>

          {/* Performance Metrics (Placeholder) */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
            </div>
            {post.status === "posted" ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">Analytics coming soon</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Performance metrics will be available after the post is published.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
