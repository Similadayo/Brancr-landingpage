'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  href?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  hoverable = false,
  href,
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800';
  const hoverStyles = hoverable || href ? 'hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.98]' : '';
  
  const content = (
    <div className={cn(baseStyles, hoverStyles, className)}>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('text-sm text-gray-600 dark:text-gray-300', className)}>
      {children}
    </div>
  );
}

