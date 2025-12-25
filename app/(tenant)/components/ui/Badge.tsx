'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  uppercase?: boolean; // Allow overriding text transform
}

const variantStyles = {
  success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  error: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px] tracking-wider',
  md: 'px-2.5 py-0.5 text-xs tracking-wider',
  lg: 'px-3 py-1 text-sm tracking-wider',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className,
  uppercase = true, // Default to uppercase for consistency with most badge usage
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        variantStyles[variant],
        sizeStyles[size],
        uppercase ? 'uppercase' : '',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Status badge helper for common statuses
export function StatusBadge({
  status,
  children,
  size = 'sm',
  uppercase = true, // Default to uppercase for most status badges (campaigns, etc.)
}: {
  status: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean; // Allow overriding for cards that use capitalize
}) {
  const statusLower = status.toLowerCase();
  
  let variant: BadgeVariant = 'neutral';
  if (statusLower === 'completed' || statusLower === 'verified' || statusLower === 'confirmed' || statusLower === 'posted') {
    variant = 'success';
  } else if (statusLower === 'pending' || statusLower === 'processing' || statusLower === 'posting') {
    variant = 'warning';
  } else if (statusLower === 'failed' || statusLower === 'cancelled' || statusLower === 'disputed') {
    variant = 'error';
  } else if (statusLower === 'scheduled' || statusLower === 'active') {
    variant = 'info';
  }

  return (
    <Badge variant={variant} size={size} uppercase={uppercase}>
      {children || status}
    </Badge>
  );
}

