'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

interface ImageMessageProps {
  media: InteractionMedia;
}

export function ImageMessage({ media }: ImageMessageProps) {
  const [imageError, setImageError] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  // Use stored_url (permanent) if available, fallback to url
  const imageUrl = media.stored_url || media.url;

  if (!imageUrl) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <span className="text-sm text-red-700">📷 Image (unavailable)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="relative cursor-pointer rounded-lg overflow-hidden"
        onClick={() => setShowFullscreen(true)}
      >
        <Image
          src={imageUrl}
          alt={media.caption || 'Image message'}
          width={400}
          height={300}
          className="max-w-full h-auto rounded-lg"
          onError={() => setImageError(true)}
          unoptimized
        />
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
            <span className="text-sm text-gray-600 mb-2">Failed to load image</span>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Open in new tab
            </a>
          </div>
        )}
      </div>

      {/* Caption */}
      {media.caption && (
        <div className="text-sm text-gray-600">
          {media.caption}
        </div>
      )}

      {/* AI Analysis (for understanding context) */}
      {media.image_analysis && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">AI Analysis</summary>
          <p className="mt-1 text-gray-600">{media.image_analysis}</p>
        </details>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
          onClick={() => setShowFullscreen(false)}
        >
          <Image
            src={imageUrl}
            alt={media.caption || 'Image'}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
          <button 
            className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(false);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

