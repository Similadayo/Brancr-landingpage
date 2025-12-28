'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      aria-hidden="true"
    />
  );
}

// Common skeleton patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-600 dark:bg-gray-700', className)}>
      <Skeleton variant="text" className="h-5 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  const sizeMap: Record<number, string> = {
    32: 'w-8 h-8',
    40: 'w-10 h-10',
    48: 'w-12 h-12',
    64: 'w-16 h-16',
  };
  return <Skeleton variant="circular" className={sizeMap[size] || `w-[${size}px] h-[${size}px]`} />;
}

