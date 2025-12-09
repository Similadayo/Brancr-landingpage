'use client';

import { useState } from 'react';
import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

interface AudioMessageProps {
  media: InteractionMedia;
}

export function AudioMessage({ media }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use stored_url (permanent) if available, fallback to url
  const audioUrl = media.stored_url || media.url;

  if (!audioUrl) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <span className="text-sm text-red-700">🎤 Audio message (unavailable)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-3">
        <audio
          controls
          src={audioUrl}
          className="w-full h-10"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          aria-label="Audio message player"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
      
      {/* Show transcription if available */}
      {media.transcription && (
        <div className="rounded-lg border border-gray-200 bg-white p-2">
          <span className="text-xs font-semibold text-gray-600">Transcription: </span>
          <span className="text-xs text-gray-700">{media.transcription}</span>
        </div>
      )}

      {/* Fallback download link */}
      <div className="text-xs">
        <a 
          href={audioUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          📥 Download audio
        </a>
      </div>
    </div>
  );
}

