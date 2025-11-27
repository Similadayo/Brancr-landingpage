'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useMedia, useUploadMedia, useDeleteMedia, useUpdateMedia } from "@/app/(tenant)/hooks/useMedia";

export default function MediaLibraryPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{ id: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading, error } = useMedia({ 
    q: query || undefined, 
    type: type || undefined 
  });
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const updateMutation = useUpdateMedia();

  const filtered = useMemo(() => {
    return assets.map((asset) => ({
      ...asset,
      url: asset.url || asset.urls?.[0] || "",
      thumbnail_url: asset.thumbnail_url || asset.urls?.[0] || "",
    }));
  }, [assets]);

  const toggleMedia = (mediaId: string | number) => {
    const idStr = String(mediaId);
    if (selectedMediaIds.includes(idStr)) {
      setSelectedMediaIds(selectedMediaIds.filter((id) => id !== idStr));
    } else {
      setSelectedMediaIds([...selectedMediaIds, idStr]);
    }
  };

  const selectAll = () => {
    setSelectedMediaIds(filtered.map((asset) => String(asset.id)));
  };

  const clearSelection = () => {
    setSelectedMediaIds([]);
  };

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

      {/* Selection Controls */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedMediaIds.length > 0 ? (
                  <>
                    <span className="text-primary">{selectedMediaIds.length}</span> media item{selectedMediaIds.length !== 1 ? "s" : ""} selected
                  </>
                ) : (
                  <span className="text-gray-500">No media selected</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedMediaIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition"
              >
                Clear Selection
              </button>
            )}
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary transition"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Failed to load media</p>
          <p className="mt-2 text-xs text-rose-700">{error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-4xl">
            📷
          </div>
          <p className="text-lg font-semibold text-gray-900">No media found</p>
          <p className="mt-2 text-sm text-gray-600">Upload your first image or video to get started.</p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90 hover:scale-105"
          >
            Upload Media
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset, index) => {
            const isSelected = selectedMediaIds.includes(String(asset.id));
            const selectionIndex = isSelected ? selectedMediaIds.indexOf(String(asset.id)) + 1 : null;
            return (
              <div key={asset.id} className="relative group">
                <div
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                      : "border-gray-200 hover:border-primary/50 hover:shadow-md"
                  } bg-white`}
                  onClick={() => toggleMedia(asset.id)}
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.thumbnail_url || asset.url}
                      alt={asset.caption || `Media ${index + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Selection Badge */}
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 bg-primary/10" />
                        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                          {selectionIndex}
                        </div>
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </>
                    )}
                    {/* Type Badge */}
                    <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                      {asset.type}
                    </span>
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const previewUrl = (asset.thumbnail_url || asset.url || "") as string;
                        if (previewUrl) {
                          setPreviewMedia({ id: String(asset.id), url: previewUrl });
                        }
                      }}
                      className="absolute left-2 bottom-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                      aria-label="Preview media"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="line-clamp-2 text-xs text-gray-600">{asset.caption || "No caption"}</p>
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            {t}
                          </span>
                        ))}
                        {asset.tags.length > 2 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            +{asset.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({ assetId: String(asset.id), payload: { caption: asset.caption || "" } });
                        }}
                        className="font-medium text-primary hover:text-primary/80 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this media?")) {
                            deleteMutation.mutate(String(asset.id));
                          }
                        }}
                        className="font-medium text-rose-600 hover:text-rose-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewMedia.url}
              alt="Preview"
              className="max-h-[90vh] rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-white hover:bg-black/90 transition"
              aria-label="Close preview"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Media</h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close upload modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
                  📤
                </div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Choose files to upload</p>
                <p className="mb-4 text-xs text-gray-500">Images and videos are supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
                >
                  Select Files
                </label>
              </div>
              {uploadMutation.isPending && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-800">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/20 border-t-blue-600" />
                  Uploading...
                </div>
              )}
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


