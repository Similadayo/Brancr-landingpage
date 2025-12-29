'use client';

import { useEffect } from 'react';
import { XIcon } from './icons';
import { AlertsList } from './AlertsList';

interface AlertsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertsOverlay({ isOpen, onClose }: AlertsOverlayProps) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Overlay Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl bg-white shadow-2xl dark:bg-gray-700 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Alerts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
              Important messages from Brancr
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
            aria-label="Close alerts"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AlertsList showFilters={true} showMarkAllRead={true} />
        </div>
      </div>
    </>
  );
}

