'use client';

import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

interface DocumentMessageProps {
  media: InteractionMedia;
}

export function DocumentMessage({ media }: DocumentMessageProps) {
  // Use stored_url (permanent) if available, fallback to url
  const documentUrl = media.stored_url || media.url;
  const filename = media.filename || 'document';

  if (!documentUrl) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <span className="text-sm text-red-700">📄 Document (unavailable)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📄</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{filename}</div>
            {media.document_text && (
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                {media.document_text.substring(0, 100)}
                {media.document_text.length > 100 && '...'}
              </div>
            )}
          </div>
        </div>
      </div>

      <a
        href={documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition"
        download={filename}
        aria-label={`Download document: ${filename}`}
      >
        📥 Download Document
      </a>

      {/* Show extracted text if available */}
      {media.document_text && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View Full Text</summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap text-gray-700 scrollbar-thin">
            {media.document_text}
          </pre>
        </details>
      )}
    </div>
  );
}

