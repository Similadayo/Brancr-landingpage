'use client';

import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';
import { AudioMessage } from './AudioMessage';
import { ImageMessage } from './ImageMessage';
import { VideoMessage } from './VideoMessage';
import { DocumentMessage } from './DocumentMessage';
import { StickerMessage } from './StickerMessage';

interface MessageMediaProps {
  media: InteractionMedia;
}

export function MessageMedia({ media }: MessageMediaProps) {
  if (!media || !media.type) {
    return null;
  }

  switch (media.type) {
    case 'audio':
      return <AudioMessage media={media} />;
    case 'image':
      return <ImageMessage media={media} />;
    case 'video':
      return <VideoMessage media={media} />;
    case 'document':
      return <DocumentMessage media={media} />;
    case 'sticker':
      return <StickerMessage media={media} />;
    default:
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="text-sm text-gray-600">Media type: {media.type}</span>
        </div>
      );
  }
}

