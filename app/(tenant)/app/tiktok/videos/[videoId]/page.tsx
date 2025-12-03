'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  EyeIcon,
  TrashIcon,
  ChevronLeftIcon,
} from '../../../../components/icons';
import { CommentList } from '../../../../components/tiktok';

export default function TikTokVideoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoId = params.videoId as string;

  const { data: video, isLoading: isLoadingVideo } = useQuery({
    queryKey: ['tiktok-video', videoId],
    queryFn: () => tenantApi.tiktokVideo(videoId),
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['tiktok-video-analytics', videoId],
    queryFn: () => tenantApi.tiktokVideoAnalytics(videoId),
    enabled: !!videoId,
  });

  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useQuery({
    queryKey: ['tiktok-comments', videoId],
    queryFn: () => tenantApi.tiktokComments(videoId, { max_count: 50 }),
    enabled: !!videoId,
  });


  const deleteMutation = useMutation({
    mutationFn: () => tenantApi.deleteTiktokVideo(videoId),
    onSuccess: () => {
      toast.success('Video deleted successfully');
      router.push('/app/tiktok/videos');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete video');
    },
  });


  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingVideo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-900">Video not found</p>
        <Link
          href="/app/tiktok/videos"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Videos
        </Link>
      </div>
    );
  }

  const comments = commentsData?.comments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/tiktok/videos"
            className="rounded-lg border border-gray-200 bg-white p-2 transition hover:border-primary hover:text-primary"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">
              {video.title || 'Video Details'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">Video ID: {video.video_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <TrashIcon className="mr-2 inline h-4 w-4" />
            Delete
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Video</h2>
            {video.cover_image_url ? (
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.cover_image_url}
                  alt={video.title || 'TikTok video'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[9/16] items-center justify-center rounded-lg bg-gray-100">
                <p className="text-gray-400">No preview available</p>
              </div>
            )}
            {video.description && (
              <p className="mt-4 text-sm text-gray-700">{video.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>Published: {formatDate(video.publish_time || video.create_time)}</span>
              {video.status && (
                <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold">{video.status}</span>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Comments ({comments.length})
              </h2>
            </div>

            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <CommentList
                videoId={videoId}
                comments={comments}
                onReplySuccess={() => void refetchComments()}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Analytics */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h2>
            {isLoadingAnalytics ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(analytics.analytics.views)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">❤️ Likes</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(analytics.analytics.likes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">💬 Comments</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(analytics.analytics.comments)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">📤 Shares</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(analytics.analytics.shares)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No analytics available</p>
            )}
          </div>

          {/* Video Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Video Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-600">Duration:</span>{' '}
                <span className="text-gray-900">{video.duration ? `${video.duration}s` : 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Created:</span>{' '}
                <span className="text-gray-900">{formatDate(video.create_time)}</span>
              </div>
              {video.video_url && (
                <div>
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on TikTok →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

