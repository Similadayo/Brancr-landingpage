'use client';

import Link from 'next/link';
import { ImageIcon, EyeIcon, TrashIcon } from '../../components/icons';
import StatusBadge from './StatusBadge';

type Video = {
  video_id: string;
  title?: string;
  description?: string;
  cover_image_url?: string;
  duration?: number;
  create_time?: number;
  publish_time?: number;
  status?: string;
  statistics?: {
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    share_count?: number;
  };
};

type VideoCardProps = {
  video: Video;
  onDelete?: (videoId: string) => void;
  showDelete?: boolean;
};

export default function VideoCard({ video, onDelete, showDelete = true }: VideoCardProps) {
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-gray-100">
        {video.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.cover_image_url}
            alt={video.title || 'TikTok video'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {/* Status Badge */}
        {video.status && (
          <div className="absolute right-2 top-2">
            <StatusBadge status={video.status} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
          {video.title || video.description || 'Untitled Video'}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{video.description}</p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            <span>{formatNumber(video.statistics?.view_count)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>❤️</span>
            <span>{formatNumber(video.statistics?.like_count)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>{formatNumber(video.statistics?.comment_count)}</span>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {formatDate(video.publish_time || video.create_time)}
        </p>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/app/tiktok/videos/${video.video_id}`}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            View Details
          </Link>
          {showDelete && onDelete && (
            <button
              onClick={() => onDelete(video.video_id)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

