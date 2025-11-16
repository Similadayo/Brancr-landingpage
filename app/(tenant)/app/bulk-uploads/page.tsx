'use client';

import Link from "next/link";
import { useBulkUploads } from "@/app/(tenant)/hooks/useBulkUploads";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function BulkUploadsPage() {
  const { data: sessions = [], isLoading, error } = useBulkUploads();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Bulk Uploads</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Upload many assets and let Brancr schedule them in batches using your preferred strategies.
          </p>
        </div>
        <Link
          href="/app/bulk-uploads/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
        >
          New bulk upload
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
          Failed to load bulk uploads
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">No bulk uploads yet</p>
          <p className="mt-2 text-xs text-gray-600">Create a new bulk upload to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Split strategy</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Schedule strategy</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{s.id}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_COLORS[s.status] || STATUS_COLORS["pending"]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.split_strategy || "—"}</td>
                  <td className="px-4 py-3">{s.schedule_strategy || "—"}</td>
                  <td className="px-4 py-3">{s.items_count ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(s.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/bulk-uploads/${s.id}`} className="text-primary hover:text-primary/80">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


