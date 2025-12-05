'use client';

import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons';

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md active:scale-[0.98] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="capitalize">{status}</span>
            </span>
            {payment_method && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                {payment_method.replace('_', ' ')}
              </span>
            )}
          </div>

          {payment_reference && (
            <p className="text-xs text-gray-600 mb-1">
              Ref: <span className="font-mono font-medium">{payment_reference}</span>
            </p>
          )}
          
          {order_number && (
            <p className="text-xs text-gray-600 mb-1">
              Order: <span className="font-medium">{order_number}</span>
            </p>
          )}

          <p className="text-xs text-gray-500">
            {new Date(created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-gray-900 sm:text-xl">
            {currency} {amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

