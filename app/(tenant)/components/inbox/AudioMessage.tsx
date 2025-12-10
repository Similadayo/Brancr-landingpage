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
      <div className="rounded-xl border border-gray-200 bg-white/80 px-3 py-3 shadow-sm ring-1 ring-gray-100">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">🎤</span>
          <span>{isPlaying ? "Playing audio" : "Voice note"}</span>
        </div>
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
      
      {media.transcription && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold text-gray-600">Transcript:</span> {media.transcription}
        </div>
      )}

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

