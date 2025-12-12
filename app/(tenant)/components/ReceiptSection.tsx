'use client';

import { useState, useMemo } from 'react';
import { useGenerateReceipt } from '../hooks/useReceipts';
import { ArrowUpTrayIcon, CheckCircleIcon } from './icons';

type ReceiptSectionProps = {
  paymentId: number;
  receiptId?: string;
  receiptUrl?: string;
  status: 'pending' | 'verified' | 'confirmed' | 'disputed' | 'failed';
};

export function ReceiptSection({ paymentId, receiptId, receiptUrl, status }: ReceiptSectionProps) {
  const generateMutation = useGenerateReceipt();
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = useMemo(() => {
    return !['pending', 'disputed', 'failed'].includes(status);
  }, [status]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync(paymentId);
    } finally {
      setIsGenerating(false);
    }
  };

  if (receiptUrl) {
    return (
      <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold">Receipt available</p>
          </div>
          {receiptId && <span className="text-xs text-green-700">#{receiptId}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-green-100 bg-white px-3 py-2 text-center text-xs font-semibold text-primary transition hover:border-primary/50"
          >
            View Receipt
          </a>
          <a
            href={receiptUrl}
            download
            className="flex-1 rounded-lg border border-green-100 bg-white px-3 py-2 text-center text-xs font-semibold text-primary transition hover:border-primary/50"
          >
            <ArrowUpTrayIcon className="mr-1 inline h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
      <p className="text-xs sm:text-sm">
        {canGenerate
          ? 'Generate a receipt once the payment is verified or confirmed. You can share it with customers via the portal link.'
          : 'Receipt can only be generated after the payment is verified or confirmed.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="flex-shrink-0 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? 'Generating...' : 'Generate Receipt'}
        </button>
        <span className="text-xs text-gray-400">Portal link can also be shared for customers to download their receipt.</span>
      </div>
    </div>
  );
}

