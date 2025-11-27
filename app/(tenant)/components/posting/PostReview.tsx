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
}: PostReviewProps) {
  const { data: allAssets = [] } = useMedia();

  // Get selected media assets
  const selectedMedia = allAssets.filter((asset) => selectedMediaIds.includes(asset.id));

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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
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
        ) : (
          <p className="mt-4 text-sm text-gray-500">No media selected (text-only post)</p>
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

      {/* Publish Button */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ready to publish?</p>
          <p className="mt-1 text-xs text-gray-500">
            Review all details above before publishing
          </p>
        </div>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || (scheduledDate ? scheduledDate < new Date() : false)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}

