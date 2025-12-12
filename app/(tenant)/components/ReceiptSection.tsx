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
      <div className="flex flex-col items-end gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
          <CheckCircleIcon className="h-4 w-4" />
          Receipt
          {receiptId ? <span className="text-green-800">#{receiptId}</span> : null}
        </span>
        <div className="flex items-center justify-end gap-2">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
          >
            View
          </a>
          <a
            href={receiptUrl}
            download
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
          >
            <ArrowUpTrayIcon className="mr-1 h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}

