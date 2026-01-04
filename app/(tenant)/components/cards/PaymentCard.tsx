'use client';

import { CheckCircleIcon, XCircleIcon, ClockIcon, SparklesIcon } from '../icons';
import { Card } from '../ui/Card';
import { StatusBadge, Badge } from '../ui/Badge';

type PaymentCardProps = {
  id: string | number;
  amount: number;
  currency: string;
  status: 'pending' | 'verified' | 'disputed' | 'failed' | 'confirmed';
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  order_id?: string | number;
  order_number?: string;
  source?: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'website' | string;
  isAIAssisted?: boolean;
  href?: string;
};

const sourceColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  telegram: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  website: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function PaymentCard({
  id,
  amount,
  currency,
  status,
  payment_method,
  payment_reference,
  created_at,
  order_id,
  order_number,
  source,
  isAIAssisted = false,
  href = `/app/payments/${id}`,
}: PaymentCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
        return <CheckCircleIcon className="h-3.5 w-3.5" />;
      case 'failed':
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
            <span className="capitalize">
              <StatusBadge status={status} uppercase={false}>
                {getStatusIcon(status)}
                {status}
              </StatusBadge>
            </span>
            {payment_method && (
              <Badge variant="neutral" size="sm">
                {payment_method.replace('_', ' ')}
              </Badge>
            )}
            {isAIAssisted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                <SparklesIcon className="h-3 w-3" />
                AI Sale
              </span>
            )}
            {source && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[source] || sourceColors.website}`}>
                via {source.charAt(0).toUpperCase() + source.slice(1)}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {payment_reference && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ref: <span className="font-mono font-medium">{payment_reference}</span>
              </p>
            )}

            {order_number && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Order: <span className="font-medium">{order_number}</span>
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
            {currency} {amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

