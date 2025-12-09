'use client';

import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

interface VideoMessageProps {
  media: InteractionMedia;
}

export function VideoMessage({ media }: VideoMessageProps) {
  // Use stored_url (permanent) if available, fallback to url
  const videoUrl = media.stored_url || media.url;

  if (!videoUrl) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <span className="text-sm text-red-700">🎥 Video (unavailable)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <video
        controls
        src={videoUrl}
        className="w-full max-w-full sm:max-w-md rounded-lg"
        preload="metadata"
        aria-label="Video message player"
      >
        Your browser does not support the video element.
      </video>

      {/* Caption */}
      {media.caption && (
        <div className="text-sm text-gray-600">
          {media.caption}
        </div>
      )}

      {/* Fallback download link */}
      <div className="text-xs">
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          📥 Download video
        </a>
      </div>
    </div>
  );
}

