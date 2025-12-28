'use client';

import { ReactNode } from 'react';
import { AlertIcon } from '../icons';
import { getUserFriendlyErrorMessage, ErrorMessages } from '@/lib/error-messages';
import type { ErrorContext } from '@/lib/error-messages';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  context?: ErrorContext;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ErrorState({ 
  title,
  message,
  error,
  context,
  action,
  icon,
  className = '',
  showRetry = false,
  onRetry
}: ErrorStateProps) {
  // Get user-friendly message
  const friendlyMessage = message || (error ? getUserFriendlyErrorMessage(error, context) : ErrorMessages.system.unknown);
  
  // Auto-generate title based on error type if not provided
  const errorTitle = title || (() => {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status?: number }).status;
      if (status === 401) return 'Session Expired';
      if (status === 403) return 'Access Denied';
      if (status === 404) return 'Not Found';
      if (status === 429) return 'Too Many Requests';
      if (status && status >= 500) return 'Server Error';
    }
    if (friendlyMessage.includes('internet') || friendlyMessage.includes('connection')) {
      return 'Connection Problem';
    }
    return 'Something went wrong';
  })();

  // Auto-generate retry action if showRetry is true
  const retryAction = showRetry && onRetry ? {
    label: 'Try Again',
    onClick: onRetry
  } : action;

  return (
    <div className={`card p-8 sm:p-12 text-center ${className}`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
        {icon || <AlertIcon className="h-8 w-8 text-error-600 dark:text-error-400" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{errorTitle}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
        {friendlyMessage}
      </p>
      {retryAction && (
        <div className="mt-6">
          <button 
            onClick={retryAction.onClick} 
            className="btn-primary dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {retryAction.label}
          </button>
        </div>
      )}
    </div>
  );
}

