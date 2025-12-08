'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { InboxIcon, AlertIcon } from '../icons';

interface NotificationsPanelProps {
  unreadMessages: number;
  pendingEscalations: number;
  recentConversations: Array<{
    id: number;
    customer_name: string;
    platform: string;
    unread_count: number;
    last_message_at: string;
  }>;
  recentEscalations: Array<{
    id: number;
    customerName: string;
    platform: string;
    message: string;
    priority: string;
    createdAt: string;
  }>;
}

export function NotificationsPanel({
  unreadMessages,
  pendingEscalations,
  recentConversations,
  recentEscalations,
}: NotificationsPanelProps) {
  const hasNotifications = unreadMessages > 0 || pendingEscalations > 0;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!hasNotifications && recentConversations.length === 0 && recentEscalations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
            <InboxIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Notifications</h2>
            <p className="text-xs text-gray-500">Stay updated on important activities</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No new notifications</p>
          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <InboxIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Notifications</h2>
            <p className="text-xs text-gray-500">Recent activity requiring attention</p>
          </div>
        </div>
        {hasNotifications && (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-xs font-semibold text-white">
            {unreadMessages + pendingEscalations}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Unread Messages */}
        {unreadMessages > 0 && (
          <Link
            href="/app/inbox"
            className="block rounded-lg border border-blue-200 bg-blue-50 p-3 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <InboxIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">New Messages</h3>
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-xs font-semibold text-white">
                    {unreadMessages}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  You have {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''} waiting for your response
                </p>
                {recentConversations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {recentConversations.slice(0, 2).map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate">{conv.customer_name}</span>
                        <span className="text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Pending Escalations */}
        {pendingEscalations > 0 && (
          <Link
            href="/app/escalations"
            className="block rounded-lg border border-orange-200 bg-orange-50 p-3 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Pending Escalations</h3>
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-xs font-semibold text-white">
                    {pendingEscalations}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {pendingEscalations} escalation{pendingEscalations !== 1 ? 's' : ''} require{pendingEscalations === 1 ? 's' : ''} your attention
                </p>
                {recentEscalations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {recentEscalations.slice(0, 2).map((esc) => (
                      <div key={esc.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate">{esc.customerName}</span>
                        <span className="text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(esc.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* No notifications message */}
        {!hasNotifications && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No new notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {(unreadMessages > 0 || pendingEscalations > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {unreadMessages > 0 && (
            <Link
              href="/app/inbox"
              className="flex-1 text-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              View Messages
            </Link>
          )}
          {pendingEscalations > 0 && (
            <Link
              href="/app/escalations"
              className="flex-1 text-center rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
            >
              View Escalations
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
