'use client';

import { useState } from 'react';
import { useGenerateReceipt } from '../hooks/useReceipts';
import { PackageIcon, ArrowUpTrayIcon, XIcon, CheckCircleIcon } from './icons';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

type ReceiptSectionProps = {
  paymentId?: number;
  receiptId?: string;
  receiptUrl?: string;
  orderId: number;
  canGenerate: boolean;
};

export function ReceiptSection({ paymentId, receiptId, receiptUrl, orderId, canGenerate }: ReceiptSectionProps) {
  const generateMutation = useGenerateReceipt();
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleGenerate = async () => {
    if (!paymentId) {
      toast.error('Payment ID is required to generate receipt');
      return;
    }
    try {
      await generateMutation.mutateAsync(paymentId);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Receipt</h2>
        <PackageIcon className="h-5 w-5 text-gray-400" />
      </div>

      {!receiptId ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {canGenerate
              ? 'Generate a receipt for this payment. Receipts are only available for confirmed payments.'
              : 'Receipt can only be generated after payment is confirmed.'}
          </p>
          {canGenerate && paymentId && (
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Generating Receipt...' : 'Generate Receipt'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Receipt Generated</p>
            </div>
            <p className="mt-1 text-xs text-green-700">Receipt ID: {receiptId}</p>
          </div>

          {receiptUrl && (
            <div className="flex flex-wrap gap-2">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                View Receipt
              </a>
              <a
                href={receiptUrl}
                download
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                <ArrowUpTrayIcon className="mr-1 inline h-4 w-4" />
                Download
              </a>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              💡 Receipts can be shared with customers via the portal link or email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

