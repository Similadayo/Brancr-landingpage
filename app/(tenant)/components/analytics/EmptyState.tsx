'use client';

interface EmptyStateProps {
  message: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, hint, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <p className="text-base font-medium text-gray-700 mb-2">{message}</p>
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
