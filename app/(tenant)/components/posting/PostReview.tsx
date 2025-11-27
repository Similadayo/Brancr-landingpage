'use client';

import { useMedia, type MediaAsset } from "@/app/(tenant)/hooks/useMedia";

type PostReviewProps = {
  selectedMediaIds: string[];
  caption: string;
  selectedPlatforms: string[];
  scheduledAt: string | null;
  onEdit: (step: "media" | "caption" | "platforms" | "schedule") => void;
  onPublish: () => void;
  isPublishing: boolean;
  publishingStatus?: {
    status: "idle" | "publishing" | "success" | "error";
    platformResults?: Record<string, "success" | "error">;
    error?: string;
  };
  uploadedMedia?: Array<{ id: string; url: string; thumbnail_url?: string }>;
};

const PLATFORM_NAMES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  telegram: "Telegram",
  youtube: "YouTube",
};

export default function PostReview({
  selectedMediaIds,
  caption,
  selectedPlatforms,
  scheduledAt,
  onEdit,
  onPublish,
  isPublishing,
  publishingStatus = { status: "idle" },
  uploadedMedia = [],
}: PostReviewProps) {
  const { data: allAssets = [] } = useMedia();

  // Get selected media assets (combine uploaded and existing)
  const allMedia = [
    ...uploadedMedia.map((m) => ({
      id: m.id,
      url: m.url,
      thumbnail_url: m.thumbnail_url || m.url,
      type: "image" as const,
    })),
    ...allAssets,
  ];
  const selectedMedia = allMedia.filter((asset) => selectedMediaIds.includes(String(asset.id)));

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Review & Preview</h2>

      {/* Media Preview */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Media</h3>
          <button
            type="button"
            onClick={() => onEdit("media")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        {selectedMedia.length > 0 ? (
          <div className="mt-4">
            {/* Carousel for multiple media */}
            {selectedMedia.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {selectedMedia.map((media, idx) => (
                  <div
                    key={media.id}
                    className="relative min-w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.thumbnail_url || media.url}
                      alt={`Media ${idx + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                      <p className="text-[10px] font-semibold uppercase text-white">
                        {media.type} • {idx + 1}/{selectedMedia.length}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {selectedMedia.map((media) => (
                  <div
                    key={media.id}
                    className="relative overflow-hidden rounded-xl border border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.thumbnail_url || media.url}
                      alt="media preview"
                      className="aspect-video w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                      <p className="text-[10px] font-semibold uppercase text-white">{media.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500">{selectedMedia.length} media item(s) selected</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No media selected</p>
            <p className="mt-1 text-xs text-gray-400">Text-only post (supported on Facebook)</p>
          </div>
        )}
      </section>

      {/* Caption Preview */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Caption</h3>
          <button
            type="button"
            onClick={() => onEdit("caption")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="whitespace-pre-line text-sm text-gray-700">
            {caption || <span className="text-gray-400">No caption</span>}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-500">{caption.length} characters</p>
      </section>

      {/* Platforms */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Platforms</h3>
          <button
            type="button"
            onClick={() => onEdit("platforms")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedPlatforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {PLATFORM_NAMES[platform] || platform}
            </span>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Schedule</h3>
          <button
            type="button"
            onClick={() => onEdit("schedule")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-900">
            {scheduledDate
              ? scheduledDate.toLocaleString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Publish immediately"}
          </p>
          {scheduledDate && (
            <p className="mt-1 text-xs text-gray-500">
              {scheduledDate < new Date() ? (
                <span className="text-orange-600">⚠️ Cannot schedule in the past</span>
              ) : (
                `In ${Math.round((scheduledDate.getTime() - Date.now()) / 1000 / 60)} minutes`
              )}
            </p>
          )}
        </div>
      </section>

      {/* Publishing Status */}
      {publishingStatus.status === "publishing" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600/20 border-t-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Publishing...</p>
              <p className="mt-1 text-xs text-blue-700">
                Publishing to {selectedPlatforms.map((p) => PLATFORM_NAMES[p] || p).join(", ")}...
              </p>
            </div>
          </div>
        </div>
      )}

      {publishingStatus.status === "success" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white">
              ✓
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">✅ Post published successfully!</p>
              {publishingStatus.platformResults && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(publishingStatus.platformResults).map(([platform, result]) => (
                    <span
                      key={platform}
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        result === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {PLATFORM_NAMES[platform] || platform} {result === "success" ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {publishingStatus.status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
              ✗
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Failed to publish</p>
              <p className="mt-1 text-xs text-red-700">{publishingStatus.error}</p>
              {publishingStatus.platformResults && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(publishingStatus.platformResults).map(([platform, result]) => (
                    <span
                      key={platform}
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        result === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {PLATFORM_NAMES[platform] || platform} {result === "success" ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={onPublish}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Button */}
      {publishingStatus.status === "idle" && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold text-gray-900">Ready to publish?</p>
            <p className="mt-1 text-xs text-gray-500">
              Review all details above before publishing
            </p>
            <p className="mt-2 text-xs text-gray-400">
              💡 Tip: Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px]">Cmd/Ctrl + Enter</kbd> to publish
            </p>
          </div>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing || (scheduledDate ? scheduledDate < new Date() : false)}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label={scheduledDate ? "Schedule post" : "Publish now"}
          >
            {isPublishing ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Publishing...
              </>
            ) : scheduledDate ? (
              "Schedule Post"
            ) : (
              "Publish Now"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

