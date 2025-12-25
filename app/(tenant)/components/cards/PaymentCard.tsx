'use client';

import { CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons';
import { Card } from '../ui/Card';
import { StatusBadge, Badge } from '../ui/Badge';

type PaymentCardProps = {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'verified' | 'disputed' | 'failed' | 'confirmed';
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  order_id?: number;
  order_number?: string;
  href?: string;
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
            <StatusBadge status={status}>
              {getStatusIcon(status)}
              {status}
            </StatusBadge>
            {payment_method && (
              <Badge variant="neutral" size="sm">
                {payment_method.replace('_', ' ')}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            {payment_reference && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ref: <span className="font-mono font-medium">{payment_reference}</span>
              </p>
            )}
            
            {order_number && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Order: <span className="font-medium">{order_number}</span>
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
            {currency} {amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

