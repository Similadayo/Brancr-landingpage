'use client';

import { ReactNode } from 'react';
import { AlertIcon, CheckCircleIcon } from '../icons';

interface ValidationFeedbackProps {
  error?: string;
  success?: string;
  help?: string;
  className?: string;
}

export function ValidationFeedback({ 
  error, 
  success, 
  help,
  className = '' 
}: ValidationFeedbackProps) {
  if (error) {
    return (
      <div className={`flex items-start gap-2 text-sm text-error-600 dark:text-error-400 ${className}`}>
        <AlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`flex items-start gap-2 text-sm text-success-600 dark:text-success-400 ${className}`}>
        <CheckCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{success}</span>
      </div>
    );
  }

  if (help) {
    return (
      <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        {help}
      </p>
    );
  }

  return null;
}

