'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useScheduledPosts, useCancelScheduledPost } from "@/app/(tenant)/hooks/useScheduledPosts";

const STATUS_FILTERS = ["All", "Scheduled", "Posting", "Posted", "Failed", "Cancelled"];

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  posting: "bg-amber-100 text-amber-700",
  posted: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function CampaignsPage() {
  const [filter, setFilter] = useState<string>("All");
  const { data: scheduledPosts = [], isLoading, error } = useScheduledPosts();
  const cancelMutation = useCancelScheduledPost();
  const [cancellingPostId, setCancellingPostId] = useState<string | null>(null);

  const campaigns = useMemo(() => {
    if (filter === "All") return scheduledPosts;
    return scheduledPosts.filter((post) => post.status === filter.toLowerCase());
  }, [filter, scheduledPosts]);

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

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Automation & Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Orchestrate broadcasts, drip flows, and templates that keep your community engaged across channels.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            Manage templates
          </Link>
          <Link
            href="/app/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            + Build campaign
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Campaigns</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">Pipeline</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filter === item
                    ? "border-primary bg-primary text-white shadow shadow-primary/20"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
              Failed to load scheduled posts: {error.message}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No scheduled posts yet. Start by building your first campaign.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Post</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Platforms</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Scheduled</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((post) => {
                  const canCancel = post.status === "scheduled" || post.status === "posting";
                  const isCancelling = cancellingPostId === post.id;

                  return (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{post.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                                STATUS_STYLES[post.status] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{post.caption}</p>
                          {post.last_error && (
                            <p className="mt-1 text-xs text-rose-600">Error: {post.last_error}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-gray-500">
                        {new Date(post.scheduled_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                              STATUS_STYLES[post.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {post.status}
                          </span>
                          {post.posted_at && (
                            <span className="text-xs text-gray-400">
                              Posted {new Date(post.posted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-primary">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/app/campaigns/${post.id}`} className="hover:text-primary/80">
                            View
                          </Link>
                          {canCancel && (
                            <>
                              <span className="text-gray-300">•</span>
                              <button
                                onClick={() => handleCancel(post.id, post.name)}
                                disabled={isCancelling || cancelMutation.isPending}
                                className="hover:text-rose-600 disabled:opacity-50"
                              >
                                {isCancelling ? "Cancelling..." : "Cancel"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming calendar</h3>
          <p className="mt-2 text-xs text-gray-500">
            View campaign timing and platform delivery slots. Switch to calendar view for drag-drop scheduling.
          </p>
          <div className="mt-4 grid gap-3 text-xs text-gray-600">
            {scheduledPosts
              .filter((post) => post.status === "scheduled" || post.status === "posting")
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .slice(0, 3)
              .map((post) => (
                <div key={post.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-semibold text-gray-900">{post.name}</p>
                  <p className="mt-1 text-gray-500">
                    {new Date(post.scheduled_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-gray-400">{post.platforms.join(", ")}</p>
                </div>
              ))}
            {scheduledPosts.filter((post) => post.status === "scheduled" || post.status === "posting").length === 0 && (
              <p className="text-center text-gray-400">No upcoming posts</p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900">Template library</h3>
          <p className="mt-1 text-xs text-gray-500">
            Store brand-approved copy, call-to-actions, and voice settings for consistent messaging.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">AI Reply • Delivery ETA</p>
              <p className="mt-2 text-xs text-gray-500">
                Provide estimated delivery times with dynamic tokens for order ID and courier updates.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Broadcast • Restock Alert</p>
              <p className="mt-2 text-xs text-gray-500">
                Triggered when inventory refreshes. Includes CTA buttons per channel.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Automation • Abandoned Cart</p>
              <p className="mt-2 text-xs text-gray-500">
                Multi-step flow with personalised incentives. Tracks conversions automatically.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Quick Reply • FAQ</p>
              <p className="mt-2 text-xs text-gray-500">
                One-click answers for shipping, payment, and support questions in the inbox.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm lg:col-span-3 lg:flex lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ideas board</h3>
            <p className="mt-2 text-xs text-gray-500">
              Keep a backlog of campaigns you’d love to test. Drag them into the planner when ready.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 lg:mt-0">
            <span className="rounded-xl border border-gray-200 px-4 py-2">Festive upsell flow</span>
            <span className="rounded-xl border border-gray-200 px-4 py-2">Referral reactivation</span>
            <span className="rounded-xl border border-gray-200 px-4 py-2">VIP loyalty nurture</span>
          </div>
        </div>
      </section>
    </div>
  );
}

