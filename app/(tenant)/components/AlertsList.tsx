'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, type Alert, type AlertTypeFilter, type AlertSeverityFilter } from '../hooks/useAlerts';
import { AlertIcon, CheckCircleIcon, XIcon } from '../components/icons';
import Select from './ui/Select';
import { formatTimeAgo } from '@/lib/date';

const ALERT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'system', label: 'System' },
  { value: 'billing', label: 'Billing' },
  { value: 'quota', label: 'Quota' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'feature', label: 'Feature' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-white',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-white',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-white',
};

const TYPE_ICONS: Record<string, string> = {
  system: '⚙️',
  billing: '💳',
  quota: '📊',
  security: '🔒',
  maintenance: '🔧',
  feature: '✨',
};

interface AlertsListProps {
  limit?: number;
  showFilters?: boolean;
  showMarkAllRead?: boolean;
}

export function AlertsList({ limit, showFilters = true, showMarkAllRead = true }: AlertsListProps) {
  const [typeFilter, setTypeFilter] = useState<AlertTypeFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, error } = useAlerts({
    type: typeFilter,
    severity: severityFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit,
  }) as any;

  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const alerts = useMemo(() => data?.alerts ?? [], [data?.alerts]);
  const unreadCount = data?.unread_count ?? 0;

  const filteredAlerts = alerts;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-600" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertIcon className="mx-auto h-8 w-8 text-error-600 dark:text-error-400" />
        <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Failed to load alerts</p>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
          <AlertIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No alerts</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {statusFilter === 'unread' ? 'All alerts have been read' : 'You don\'t have any alerts yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAlerts.map((alert: Alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkRead={() => markRead.mutate(alert.id)}
            isMarkingRead={markRead.isPending && markRead.variables === alert.id}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-4 space-y-3 shrink-0">
        <button
          onClick={() => setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread')}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          {statusFilter === 'unread' ? 'Show all' : 'Show unread only'}
        </button>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onMarkRead,
  isMarkingRead,
}: {
  alert: Alert;
  onMarkRead: () => void;
  isMarkingRead: boolean;
}) {
  const isRead = !!alert.read_at;

  return (
    <div
      onClick={!isRead ? onMarkRead : undefined}
      className={`group relative px-6 py-4 transition-colors ${!isRead ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/30' : ''
        } border-b border-gray-100 dark:border-gray-600/50`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm mb-1 ${!isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'
            }`}>
            {alert.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {alert.message}
          </p>
        </div>

        {/* Right: Timestamp */}
        <div className="shrink-0 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatTimeAgo(alert.created_at)}
        </div>
      </div>
    </div>
  );
}

