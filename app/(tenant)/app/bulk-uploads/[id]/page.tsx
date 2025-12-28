'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBulkUpload, useCancelBulkUpload, useUpdateBulkUpload } from "@/app/(tenant)/hooks/useBulkUploads";
import Select from "@/app/(tenant)/components/ui/Select";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function BulkUploadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { data, isLoading, error } = useBulkUpload(id);
  const cancelMutation = useCancelBulkUpload();
  const updateMutation = useUpdateBulkUpload();

  const session = data?.session;
  const items = data?.items || [];

  const [splitStrategy, setSplitStrategy] = useState<'' | 'carousels' | 'individual' | 'custom'>('');
  const [scheduleStrategy, setScheduleStrategy] = useState<'' | 'spread' | 'optimal' | 'custom'>('');

  useEffect(() => {
    if (!session) return;
    setSplitStrategy((session.split_strategy || '') as any);
    setScheduleStrategy((session.schedule_strategy || '') as any);
  }, [session]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
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
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/app/bulk-uploads"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white transition hover:border-white/50 hover:bg-white/20"
              aria-label="Back to bulk uploads"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Bulk Upload</h1>
              <p className="mt-1 text-sm text-white/90">Session ID: {id}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">Failed to load session</div>
      ) : !session ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No data</div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_COLORS[session.status] || STATUS_COLORS["pending"]}`}>
                  {session.status}
                </span>
              </div>
              {session.status === "pending" ? (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => cancelMutation.mutate(id)}
                    disabled={cancelMutation.isPending}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel session"}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Split strategy</p>
              <div className="mt-2">
                <Select
                  value={splitStrategy}
                  onChange={(value) => {
                    const next = (value || '') as any;
                    setSplitStrategy(next);
                    updateMutation.mutate({ id, payload: { split_strategy: value || undefined } });
                  }}
                  disabled={session.status !== 'pending'}
                  searchable={false}
                  buttonClassName="px-3 py-2 text-xs rounded-xl"
                  options={[
                    { value: '', label: 'Automatic' },
                    { value: 'carousels', label: 'Carousels' },
                    { value: 'individual', label: 'Individual' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Schedule strategy</p>
              <div className="mt-2">
                <Select
                  value={scheduleStrategy}
                  onChange={(value) => {
                    const next = (value || '') as any;
                    setScheduleStrategy(next);
                    updateMutation.mutate({ id, payload: { schedule_strategy: value || undefined } });
                  }}
                  disabled={session.status !== 'pending'}
                  searchable={false}
                  buttonClassName="px-3 py-2 text-xs rounded-xl"
                  options={[
                    { value: '', label: 'Automatic' },
                    { value: 'spread', label: 'Spread' },
                    { value: 'optimal', label: 'Optimal' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Items</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <div key={it.id} className="rounded-xl border border-gray-200 p-3 text-xs">
                  <p className="font-semibold text-gray-900">Asset: {it.media_asset_id}</p>
                  <p className="mt-1 text-gray-600 line-clamp-3">{it.caption || "No caption"}</p>
                  <p className="mt-2 text-gray-400">Status: {it.status}</p>
                </div>
              ))}
              {items.length === 0 ? <p className="text-center text-gray-400">No items</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}


