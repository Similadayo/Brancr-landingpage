'use client';

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'live':
      case 'connected':
        return 'bg-green-500 text-white';
      case 'processing':
      case 'pending_onboarding':
      case 'pending_verification':
        return 'bg-amber-500 text-white';
      case 'failed':
      case 'not_connected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyles(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}

