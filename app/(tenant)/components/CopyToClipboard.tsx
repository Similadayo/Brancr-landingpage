'use client';

import { useState } from 'react';
import { CheckCircleIcon } from './icons';
import { toast } from 'react-hot-toast';

type CopyToClipboardProps = {
  text: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
};

export function CopyToClipboard({ text, label, className = '', showLabel = true }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && label && (
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
        <code className="text-sm font-mono text-gray-900">{text}</code>
        <button
          onClick={handleCopy}
          className="rounded p-1 text-gray-600 transition hover:bg-gray-200 hover:text-primary"
          title="Copy to clipboard"
        >
          {copied ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

