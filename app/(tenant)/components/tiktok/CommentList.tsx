'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

type Comment = {
  comment_id: string;
  video_id: string;
  text: string;
  user: {
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  like_count?: number;
  reply_count?: number;
  create_time: number;
  is_pinned?: boolean;
  is_author_replied?: boolean;
};

type CommentListProps = {
  videoId: string;
  comments: Comment[];
  onReplySuccess?: () => void;
};

export default function CommentList({ videoId, comments, onReplySuccess }: CommentListProps) {
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});

  const replyMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      tenantApi.replyToTiktokComment(videoId, commentId, { text }),
    onSuccess: () => {
      toast.success('Reply sent successfully');
      setReplyText({});
      setShowReplyInput({});
      onReplySuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send reply');
    },
  });

  const handleReply = (commentId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) {
      toast.error('Please enter a reply');
      return;
    }
    replyMutation.mutate({ commentId, text });
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

  if (comments.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No comments yet</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.comment_id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
              {comment.user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.user.avatar_url}
                  alt={comment.user.username || 'User'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-gray-600">
                  {comment.user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {comment.user.display_name || comment.user.username || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(comment.create_time)}</p>
                {comment.is_pinned && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Pinned
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                {comment.like_count !== undefined && (
                  <span>❤️ {formatNumber(comment.like_count)}</span>
                )}
                {comment.reply_count !== undefined && (
                  <span>💬 {formatNumber(comment.reply_count)} replies</span>
                )}
              </div>

              {/* Reply Input */}
              {showReplyInput[comment.comment_id] ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText[comment.comment_id] || ''}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [comment.comment_id]: e.target.value })
                    }
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(comment.comment_id)}
                      disabled={replyMutation.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyInput({ ...showReplyInput, [comment.comment_id]: false });
                        setReplyText({ ...replyText, [comment.comment_id]: '' });
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setShowReplyInput({ ...showReplyInput, [comment.comment_id]: true })
                  }
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

