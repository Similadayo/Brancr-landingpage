'use client';

import Link from 'next/link';
import { PackageIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '../icons';

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{order_number}</h3>
            {isNew && (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                New
              </span>
            )}
            {isAutoCreated && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                Auto-created
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="capitalize">{status}</span>
            </span>
          </div>
          
          <div className="mt-2 space-y-1">
            {payment_reference && (
              <p className="text-xs text-gray-600">
                Ref: <span className="font-mono font-medium">{payment_reference}</span>
              </p>
            )}
            {items_count !== undefined && (
              <p className="text-xs text-gray-600">
                Items: <span className="font-medium">{items_count} item(s)</span>
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
        </div>
        
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-gray-900 sm:text-xl">
            {currency} {total_amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

