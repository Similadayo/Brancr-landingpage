'use client';

import Image from 'next/image';
import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

interface StickerMessageProps {
  media: InteractionMedia;
}

export function StickerMessage({ media }: StickerMessageProps) {
  // Use stored_url (permanent) if available, fallback to url
  const stickerUrl = media.stored_url || media.url;

  if (!stickerUrl) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <span className="text-sm text-red-700">😊 Sticker (unavailable)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Image
        src={stickerUrl}
        alt="Sticker message"
        width={200}
        height={200}
        className="max-w-full sm:max-w-[200px] h-auto rounded-lg"
        unoptimized
        sizes="(max-width: 640px) 150px, 200px"
      />
      {media.image_analysis && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">AI Description</summary>
          <p className="mt-1 text-gray-600">{media.image_analysis}</p>
        </details>
      )}
    </div>
  );
}

