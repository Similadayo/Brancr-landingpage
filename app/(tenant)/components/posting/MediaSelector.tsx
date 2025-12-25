'use client';

import { useState } from "react";
import { useMedia, type MediaAsset } from "@/app/(tenant)/hooks/useMedia";

type MediaSelectorProps = {
  selectedMediaIds: string[];
  onSelectionChange: (mediaIds: string[]) => void;
  uploadedMedia?: Array<{ id: string; url: string; thumbnail_url?: string }>;
};

export default function MediaSelector({
  selectedMediaIds,
  onSelectionChange,
  uploadedMedia = [],
}: MediaSelectorProps) {
  // Fetch all media types (images, videos, carousels) - no type filter
  const { data: assets = [], isLoading } = useMedia();
  const [previewMedia, setPreviewMedia] = useState<{ id: string; url: string } | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Combine uploaded media with existing assets
  // Note: uploadedMedia doesn't have type info, so we infer from URL or default to image
  const allMedia = [
    ...uploadedMedia.map((m) => {
      // Try to infer type from URL extension
      const url = m.url.toLowerCase();
      const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('.avi') || url.includes('.mkv');
      return {
        id: m.id,
        url: m.url,
        thumbnail_url: m.thumbnail_url || m.url,
        type: (isVideo ? "video" : "image") as "image" | "video" | "carousel",
        created_at: new Date().toISOString(),
      };
    }),
    ...assets.map((asset) => ({
      ...asset,
      url: asset.url || asset.urls?.[0] || "",
      thumbnail_url: asset.thumbnail_url || asset.urls?.[0] || "",
    })),
  ];
  
  // Debug: Log media types to help diagnose (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const videoCount = allMedia.filter(m => m.type === 'video').length;
    const imageCount = allMedia.filter(m => m.type === 'image').length;
    if (videoCount > 0 || imageCount > 0) {
      console.log(`[MediaSelector] Total: ${allMedia.length} (${imageCount} images, ${videoCount} videos)`);
    }
  }

  const toggleMedia = (mediaId: string | number) => {
    const idStr = String(mediaId);
    if (selectedMediaIds.includes(idStr)) {
      onSelectionChange(selectedMediaIds.filter((id) => id !== idStr));
    } else {
      onSelectionChange([...selectedMediaIds, idStr]);
    }
  };

  const selectAll = () => {
    // Only select media that has valid images (not broken)
    const validMedia = allMedia.filter((m) => !brokenImages.has(String(m.id)));
    onSelectionChange(validMedia.map((m) => String(m.id)));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (allMedia.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-2xl">
          📷
        </div>
        <p className="text-sm font-semibold text-gray-900">No media available</p>
        <p className="mt-2 text-xs text-gray-500">
          Upload media in the previous step or use existing media from your library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Media</h2>
          <p className="mt-1 text-sm font-medium text-gray-700">
            {selectedMediaIds.length > 0 ? (
              <>
                <span className="text-primary">{selectedMediaIds.length}</span> media item{selectedMediaIds.length !== 1 ? "s" : ""} selected
              </>
            ) : (
              <span className="text-gray-500">No media selected</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedMediaIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
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

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        ℹ️ Media is optional. Facebook supports text-only posts, so you can proceed without media if you plan to select Facebook as a platform.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allMedia
          .filter((media) => !brokenImages.has(String(media.id)))
          .map((media, index) => {
            const isSelected = selectedMediaIds.includes(String(media.id));
            const selectionIndex = isSelected ? selectedMediaIds.indexOf(String(media.id)) + 1 : null;
            return (
              <div key={media.id} className="relative group">
                <button
                  type="button"
                  onClick={() => toggleMedia(String(media.id))}
                  className={`relative w-full overflow-hidden rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                      : "border-gray-200 hover:border-primary/50 hover:shadow-md"
                  } bg-white`}
                  aria-label={`${isSelected ? "Deselect" : "Select"} media ${index + 1}`}
                >
                  {media.type === 'video' ? (
                    <div className="relative aspect-video w-full bg-gray-900">
                      <video
                        src={media.url}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        muted
                        playsInline
                        preload="metadata"
                        onError={() => {
                          setBrokenImages((prev) => new Set(prev).add(String(media.id)));
                        }}
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg">
                          <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media.thumbnail_url || media.url}
                      alt={`Media ${index + 1}`}
                      className="aspect-video w-full max-h-64 object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      onError={() => {
                        setBrokenImages((prev) => new Set(prev).add(String(media.id)));
                      }}
                    />
                  )}
                {/* Selection Badge */}
                {isSelected && (
                  <>
                    <div className="absolute inset-0 bg-primary/10" />
                    <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                      {selectionIndex}
                    </div>
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      ✓
                    </div>
                  </>
                )}
                {/* Type Badge */}
                <div className="absolute right-2 bottom-2">
                  <div className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-white backdrop-blur-sm">
                    {media.type}
                  </div>
                </div>
                {/* Preview Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // For videos, use the video URL; for images, use thumbnail or URL
                    const previewUrl = media.type === 'video' 
                      ? (media.url || "") 
                      : (media.thumbnail_url || media.url || "");
                    if (previewUrl) {
                      setPreviewMedia({ id: String(media.id), url: previewUrl });
                    }
                  }}
                  className="absolute left-2 bottom-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                  aria-label="Preview media"
                >
                  {media.type === 'video' ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </button>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            {(() => {
              const media = allMedia.find((m) => String(m.id) === previewMedia.id);
              const isVideo = media?.type === 'video';
              
              return isVideo ? (
                <video
                  src={previewMedia.url}
                  controls
                  className="max-h-[90vh] rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewMedia.url}
                  alt="Preview"
                  className="max-h-[90vh] rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              );
            })()}
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
    </div>
  );
}

