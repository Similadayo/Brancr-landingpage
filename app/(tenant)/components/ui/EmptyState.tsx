'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-700/50',
      className
    )}>
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

