'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useMedia, useUploadMedia, useDeleteMedia, useUpdateMedia } from "@/app/(tenant)/hooks/useMedia";

export default function MediaLibraryPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading, error } = useMedia({ 
    q: query || undefined, 
    type: type || undefined 
  });
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();

  const filtered = useMemo(() => assets, [assets]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    // API expects 'file' field name for each file
    Array.from(files).forEach((file) => {
      form.append("file", file);
      // Optional: add name if needed
      // form.append("name", file.name);
    });
    await uploadMutation.mutateAsync(form);
    setIsUploadOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Media Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">Manage your images and videos for posts and campaigns.</p>
          {uploadMutation.isError && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              ⚠️ Media upload is currently being implemented. Pre-signed URL generation coming soon.
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type || ""}
            onChange={(e) => setType(e.target.value || undefined)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="carousel">Carousels</option>
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media..."
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          />
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
          >
            Upload
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
          Failed to load media: {error.message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">No media found</p>
          <p className="mt-2 text-xs text-gray-600">Upload files to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <div key={asset.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-video overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.thumbnail_url || asset.url}
                  alt={asset.caption || "Media"}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-700">
                  {asset.type}
                </span>
              </div>
              <div className="space-y-3 p-3">
                <p className="line-clamp-2 text-xs text-gray-600">{asset.caption || "No caption"}</p>
                <div className="flex flex-wrap gap-1">
                  {(asset.tags || []).map((t) => (
                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ assetId: String(asset.id), payload: { caption: asset.caption || "" } })
                    }
                    className="text-gray-600 hover:text-primary"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(String(asset.id))}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload media</h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <input ref={fileInputRef} type="file" multiple onChange={(e) => handleUpload(e.target.files)} />
              <p className="text-xs text-gray-500">Images and videos are supported.</p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


