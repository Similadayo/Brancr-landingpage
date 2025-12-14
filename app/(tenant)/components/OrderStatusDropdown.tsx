import React, { useState } from 'react';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

interface Props {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  validTransitions: OrderStatus[];
  disabled?: boolean;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function OrderStatusDropdown({ value, onChange, validTransitions, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {STATUS_LABELS[value]}
        <span className="ml-2">▼</span>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {validTransitions.map((status) => (
            <li key={status}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 ${status === value ? 'font-bold text-primary' : ''}`}
                onClick={() => {
                  setOpen(false);
                  if (status !== value) onChange(status);
                }}
                disabled={status === value}
              >
                {STATUS_LABELS[status]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
