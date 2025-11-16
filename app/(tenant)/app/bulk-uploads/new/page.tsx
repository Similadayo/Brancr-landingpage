'use client';

import { useRef, useState } from "react";
import Link from "next/link";
import { useCreateBulkUpload } from "@/app/(tenant)/hooks/useBulkUploads";

export default function NewBulkUploadPage() {
  const [splitStrategy, setSplitStrategy] = useState<string>("");
  const [scheduleStrategy, setScheduleStrategy] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateBulkUpload();

  async function handleSubmit() {
    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) return;
    try {
      setIsSubmitting(true);
      const form = new FormData();
      Array.from(fileInputRef.current.files).forEach((f) => form.append("files", f));
      if (splitStrategy) form.append("split_strategy", splitStrategy);
      if (scheduleStrategy) form.append("schedule_strategy", scheduleStrategy);
      const res = await createMutation.mutateAsync(form);
      window.location.href = "/app/bulk-uploads";
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">New Bulk Upload</h1>
          <p className="mt-2 text-sm text-gray-600">Upload many assets and configure how to split and schedule them.</p>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            ⚠️ Bulk upload job creation is coming soon. The backend endpoint is currently being implemented.
          </div>
        </div>
        <Link
          href="/app/bulk-uploads"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
        >
          ← Back to Bulk Uploads
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900">Upload files</h2>
          <input ref={fileInputRef} type="file" multiple className="mt-3 text-sm" />
          <p className="mt-2 text-xs text-gray-500">Images and videos supported.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Strategies</h2>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Split</p>
            <select
              value={splitStrategy}
              onChange={(e) => setSplitStrategy(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            >
              <option value="">Automatic</option>
              <option value="carousels">Carousels</option>
              <option value="individual">Individual</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Schedule</p>
            <select
              value={scheduleStrategy}
              onChange={(e) => setScheduleStrategy(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            >
              <option value="">Automatic</option>
              <option value="spread">Spread</option>
              <option value="optimal">Optimal</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/app/bulk-uploads"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
        >
          Cancel
        </Link>
        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}


