'use client';

import { ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '../icons';
import { Card } from '../ui/Card';
import { StatusBadge, Badge } from '../ui/Badge';

type OrderCardProps = {
  id: string | number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  currency: string;
  created_at: string;
  items_count?: number;
  payment_reference?: string;
  isNew?: boolean;
  isAutoCreated?: boolean;
  source?: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'website' | string;
  isAIAssisted?: boolean;
  conversationId?: string;
  href?: string;
};

const sourceColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  telegram: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  website: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function OrderCard({
  id,
  order_number,
  status,
  total_amount,
  currency,
  created_at,
  items_count,
  payment_reference,
  isNew = false,
  isAutoCreated = false,
  source,
  isAIAssisted = false,
  conversationId,
  href = `/app/orders/${id}`,
}: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-3.5 w-3.5" />;
      case 'cancelled':
        return <XCircleIcon className="h-3.5 w-3.5" />;
      default:
        return <ClockIcon className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card href={href} hoverable>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{order_number}</h3>
            {isNew && (
              <Badge variant="info" size="sm">
                New
              </Badge>
            )}
            {isAutoCreated && (
              <Badge variant="info" size="sm">
                Auto-created
              </Badge>
            )}
            {isAIAssisted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                <SparklesIcon className="h-3 w-3" />
                AI Sale
              </span>
            )}
            <span className="capitalize">
              <StatusBadge status={status} uppercase={false}>
                {getStatusIcon(status)}
                {status}
              </StatusBadge>
            </span>
          </div>

          <div className="space-y-1.5">
            {source && (
              <p className="text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[source] || sourceColors.website}`}>
                  via {source.charAt(0).toUpperCase() + source.slice(1)}
                </span>
              </p>
            )}
            {payment_reference && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ref: <span className="font-mono font-medium">{payment_reference}</span>
              </p>
            )}
            {items_count !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Items: <span className="font-medium">{items_count} item(s)</span>
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {currency} {total_amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

