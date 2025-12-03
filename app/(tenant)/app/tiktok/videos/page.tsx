'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ImageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '../../../components/icons';
import { VideoCard } from '../../../components/tiktok';

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

export default function TikTokVideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [maxCount] = useState(20);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tiktok-videos', cursor, maxCount],
    queryFn: async () => {
      const params: { max_count?: number; cursor?: string } = { max_count: maxCount };
      if (cursor) params.cursor = cursor;
      return await tenantApi.tiktokVideos(params);
    },
  });

  const videos = data?.videos || [];
  const hasMore = data?.has_more || false;
  const nextCursor = data?.cursor;

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (video) =>
        video.title?.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await tenantApi.deleteTiktokVideo(videoId);
      toast.success('Video deleted successfully');
      void refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete video');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">TikTok Videos</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Manage your TikTok videos, view analytics, and engage with comments
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/tiktok/analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            <FunnelIcon className="w-4 h-4" />
            Analytics
          </Link>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or description..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Failed to load videos</p>
          <p className="mt-1 text-xs text-rose-700">{error?.message || 'Unknown error occurred'}</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-900">No videos found</p>
          <p className="mt-1 text-xs text-gray-500">
            {searchQuery ? 'Try adjusting your search query' : 'Your TikTok videos will appear here'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.video_id}
                video={video}
                onDelete={handleDelete}
                showDelete={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {hasMore && nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={() => setCursor(nextCursor)}
                className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

