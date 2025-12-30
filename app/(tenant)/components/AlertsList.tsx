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
  });

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
    <div className="space-y-4">
      {/* Filters and Actions */}
      {(showFilters || showMarkAllRead) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(value) => setTypeFilter((value || 'all') as AlertTypeFilter)}
                searchable={false}
                options={ALERT_TYPE_OPTIONS}
                className="min-w-[140px]"
              />
              <Select
                value={severityFilter}
                onChange={(value) => setSeverityFilter((value || 'all') as AlertSeverityFilter)}
                searchable={false}
                options={SEVERITY_OPTIONS}
                className="min-w-[140px]"
              />
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter((value || 'all') as 'all' | 'unread' | 'read')}
                searchable={false}
                options={STATUS_OPTIONS}
                className="min-w-[120px]"
              />
            </div>
          )}
          {showMarkAllRead && unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="btn-ghost text-xs sm:text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkRead={() => markRead.mutate(alert.id)}
            isMarkingRead={markRead.isPending && markRead.variables === alert.id}
          />
        ))}
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
  const severityColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.info;
  const typeIcon = TYPE_ICONS[alert.type] || '📢';

  return (
    <div
      className={`card group relative overflow-hidden p-5 transition-all hover:shadow-lg sm:p-6 ${
        !isRead ? 'border-l-4 border-l-primary' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-600">
          {typeIcon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                  {alert.title}
                </h3>
                <span className={`badge ${severityColor} text-xs`}>
                  {alert.severity}
                </span>
                {!isRead && (
                  <span className="badge badge-primary text-xs">New</span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {alert.message}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(alert.created_at)}
                </span>
                {(alert.sent_email || alert.sent_telegram) && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    {alert.sent_email && <span>✓ Email</span>}
                    {alert.sent_telegram && <span>✓ Telegram</span>}
                  </div>
                )}
                {alert.action_url && alert.action_label && (
                  <Link
                    href={alert.action_url}
                    className="text-xs font-semibold text-primary hover:text-primary/80 dark:text-white dark:hover:text-gray-200"
                  >
                    {alert.action_label} →
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isRead && (
              <button
                onClick={onMarkRead}
                disabled={isMarkingRead}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Mark as read"
              >
                {isMarkingRead ? '...' : 'Mark read'}
              </button>
            )}
            {isRead && (
              <div className="shrink-0 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Read</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

