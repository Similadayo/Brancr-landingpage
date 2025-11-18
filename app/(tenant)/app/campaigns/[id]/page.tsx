'use client';

import Link from "next/link";
import { use } from "react";
import { useScheduledPost, useCancelScheduledPost } from "@/app/(tenant)/hooks/useScheduledPosts";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: post, isLoading, error } = useScheduledPost(id);
  const cancelMutation = useCancelScheduledPost();

  const handleCancel = () => {
    if (post && confirm(`Are you sure you want to cancel "${post.name}"? This cannot be undone.`)) {
      cancelMutation.mutate(id);
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
      <div className="space-y-10">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-12 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Post Not Found</h1>
          <p className="mt-2 text-sm text-gray-600">
            The scheduled post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/app/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    posted: "bg-emerald-100 text-emerald-700 border-emerald-200",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    posting: "bg-amber-100 text-amber-700 border-amber-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const canCancel = post.status === "scheduled" || post.status === "posting";

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">{post.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>Created {new Date(post.created_at).toLocaleDateString()}</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                statusColors[post.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {post.status}
            </span>
            {post.posted_at && (
              <span>Posted {new Date(post.posted_at).toLocaleDateString()}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Post"}
            </button>
          )}
          <Link
            href="/app/campaigns"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Platforms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(post.platforms) ? post.platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 capitalize"
              >
                {platform}
              </span>
            )) : (
              <span className="text-xs text-gray-400">No platforms</span>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scheduled For</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {new Date(post.scheduled_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Attempts</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{post.attempts}</p>
          {post.last_error && (
            <p className="mt-1 text-xs text-rose-600">Last error occurred</p>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Post Content</h2>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{post.caption}</p>
        </div>
        {post.last_error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">Error Details</p>
            <p className="mt-2 text-sm text-rose-700">{post.last_error}</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <h3 className="text-sm font-semibold text-amber-900">Campaign Details Preview</h3>
        <p className="mt-2 text-sm text-amber-700">
          This is a preview of campaign details. Full analytics, audience targeting, and campaign editing features are
          coming soon.
        </p>
      </section>
    </div>
  );
}

