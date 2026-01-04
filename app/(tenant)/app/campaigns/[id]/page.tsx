'use client';

import React, { useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledPost, useCancelScheduledPost } from "@/app/(tenant)/hooks/useScheduledPosts";
import { useMedia } from "@/app/(tenant)/hooks/useMedia";
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
import ConfirmModal from '@/app/components/ConfirmModal';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const queryClient = useQueryClient();
  const { data: post, isLoading, error } = useScheduledPost(id);
  const { data: mediaList } = useMedia(); // Fetch all media to resolve IDs
  const cancelMutation = useCancelScheduledPost();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  // Resolve media assets from IDs
  const resolvedMedia = useMemo(() => {
    if (!post?.media_asset_ids || !mediaList) return [];
    return mediaList.filter(asset =>
      post.media_asset_ids.some(id => String(id) === String(asset.id))
    );
  }, [post?.media_asset_ids, mediaList]);

  const handleCancel = () => {
    if (post) setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    cancelMutation.mutate(id);
    setShowCancelConfirm(false);
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
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Post Not Found</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-500/20",
      icon: <CheckCircleIcon className="h-3.5 w-3.5" />,
    },
    scheduled: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-500/20",
      icon: <ClockIcon className="h-3.5 w-3.5" />,
    },
    posting: {
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-500/20",
      icon: <PlayIcon className="h-3.5 w-3.5" />,
    },
    failed: {
      bg: "bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-500/20",
      icon: <XCircleIcon className="h-3.5 w-3.5" />,
    },
    cancelled: {
      bg: "bg-gray-500/10",
      text: "text-gray-700 dark:text-gray-400",
      border: "border-gray-500/20",
      icon: <XCircleIcon className="h-3.5 w-3.5" />,
    },
  };

  const statusStyle = statusColors[post.status] || statusColors.cancelled;
  const canCancel = post.status === "scheduled" || post.status === "posting";
  const canPublish = post.status === "scheduled";

  return (
    <div className="space-y-6 pb-20">
      {showCancelConfirm && (
        <ConfirmModal
          open={true}
          title="Cancel post"
          description={`Are you sure you want to cancel "${post.name}"? This cannot be undone.`}
          confirmText="Cancel post"
          onConfirm={() => { confirmCancel(); }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] p-6 shadow-xl sm:p-10">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link
            href="/app/campaigns"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Campaigns
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl leading-tight">
                {post.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/90">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-md ${statusStyle.bg} ${statusStyle.border} text-white border-white/20`}>
                  {statusStyle.icon}
                  <span className="capitalize">{post.status}</span>
                </span>
                <span className="text-sm">
                  Created {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {canPublish && (
                <button
                  onClick={handlePublishNow}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#6366f1] shadow-lg transition hover:bg-gray-50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isPublishing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366f1]/30 border-t-[#6366f1]" />
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
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Cancel Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Platforms</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{post.platforms?.length || 0}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <RocketIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Scheduled</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="truncate">
                  {post.scheduled_at ? (
                    <>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(post.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-gray-400">Not scheduled</p>
                  )}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <ClockIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Attempts</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{post.attempts || 0}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <ChartBarIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Media</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{post.media_asset_ids?.length || 0}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Post Content</h2>
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300">
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {post.caption || <span className="text-gray-400 italic">No caption provided...</span>}
              </p>
            </div>
          </div>

          {/* Media Gallery */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Media</h2>

            {resolvedMedia.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {resolvedMedia.map((media, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.url || media.thumbnail_url}
                      alt={media.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-400">No media attached</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platforms */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {post.platforms?.length > 0 ? (
                post.platforms.map(platform => (
                  <span key={platform} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {platform}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No platforms selected</span>
              )}
            </div>
          </div>

          {/* Error Details if any */}
          {post.last_error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 shadow-sm dark:border-rose-900/30 dark:bg-rose-900/10">
              <div className="flex items-start gap-3">
                <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <h3 className="font-semibold text-rose-900 dark:text-rose-300">Error Details</h3>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">{post.last_error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Placeholder */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Performance</h3>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-900/50">
              <p className="text-sm text-gray-500">
                {post.status === 'posted' ? 'Analytics coming soon...' : 'Stats available after publishing'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
