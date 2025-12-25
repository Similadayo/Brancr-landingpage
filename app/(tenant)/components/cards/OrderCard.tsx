'use client';

import { ClockIcon, CheckCircleIcon, XCircleIcon } from '../icons';
import { Card } from '../ui/Card';
import { StatusBadge, Badge } from '../ui/Badge';

type OrderCardProps = {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  currency: string;
  created_at: string;
  items_count?: number;
  payment_reference?: string;
  isNew?: boolean;
  isAutoCreated?: boolean;
  href?: string;
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
            <span className="capitalize">
              <StatusBadge status={status} uppercase={false}>
                {getStatusIcon(status)}
                {status}
              </StatusBadge>
            </span>
          </div>
          
          <div className="space-y-1.5">
            {payment_reference && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ref: <span className="font-mono font-medium">{payment_reference}</span>
              </p>
            )}
            {items_count !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Items: <span className="font-medium">{items_count} item(s)</span>
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500">
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

