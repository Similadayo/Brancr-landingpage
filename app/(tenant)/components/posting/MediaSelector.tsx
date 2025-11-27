'use client';

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
  const { data: assets = [], isLoading } = useMedia();

  // Combine uploaded media with existing assets
  const allMedia = [
    ...uploadedMedia.map((m) => ({
      id: m.id,
      url: m.url,
      thumbnail_url: m.thumbnail_url || m.url,
      type: "image" as const,
      created_at: new Date().toISOString(),
    })),
    ...assets,
  ];

  const toggleMedia = (mediaId: string) => {
    if (selectedMediaIds.includes(mediaId)) {
      onSelectionChange(selectedMediaIds.filter((id) => id !== mediaId));
    } else {
      onSelectionChange([...selectedMediaIds, mediaId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(allMedia.map((m) => m.id));
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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-sm font-semibold text-gray-900">No media available</p>
        <p className="mt-2 text-xs text-gray-500">Upload media in the previous step or use existing media.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Media</h2>
          <p className="mt-1 text-xs text-gray-500">
            {selectedMediaIds.length} of {allMedia.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        ℹ️ Media is optional. Facebook supports text-only posts, so you can proceed without media if you plan to select Facebook as a platform.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allMedia.map((media) => {
          const isSelected = selectedMediaIds.includes(media.id);
          return (
            <button
              type="button"
              key={media.id}
              onClick={() => toggleMedia(media.id)}
              className={`group relative overflow-hidden rounded-2xl border transition ${
                isSelected
                  ? "border-primary ring-2 ring-primary/30 shadow-md"
                  : "border-gray-200 hover:border-primary/50"
              } bg-white`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.thumbnail_url || media.url}
                alt="media"
                className="aspect-video w-full object-cover transition group-hover:scale-105"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                    ✓
                  </div>
                </div>
              )}
              <div className="absolute right-2 top-2">
                <div className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {media.type}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

