'use client';

import { ReactNode } from 'react';
import { AlertIcon, XIcon } from '../icons';
// Using btn-primary class instead of Button component for consistency

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong',
  message,
  action,
  icon,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`card p-8 sm:p-12 text-center ${className}`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
        {icon || <AlertIcon className="h-8 w-8 text-error-600 dark:text-error-400" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
      {action && (
        <div className="mt-6">
          <button onClick={action.onClick} className="btn-primary">
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}

