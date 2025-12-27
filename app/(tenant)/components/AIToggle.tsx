'use client';

import React from 'react';

type AIToggleProps = {
  value: 'ai' | 'human';
  onChange?: (next: 'ai' | 'human') => void;
  disabled?: boolean;
  showLabel?: boolean;
};

export default function AIToggle({ value, onChange, disabled = false, showLabel = true }: AIToggleProps) {
  const isAi = value === 'ai';

  const handleClick = () => {
    if (disabled) return;
    if (onChange) onChange(isAi ? 'human' : 'ai');
  };

  return (
    <div className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 p-1" role="tablist" aria-label="AI mode">
      <button
        type="button"
        role="tab"
        aria-selected={isAi}
        onClick={() => { if (!disabled && onChange) onChange('ai'); }}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${isAi ? 'bg-primary text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
      >
        AI
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={!isAi}
        onClick={() => { if (!disabled && onChange) onChange('human'); }}
        disabled={disabled}
        className={`ml-1 px-3 py-1.5 rounded-full text-sm font-medium transition ${!isAi ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
      >
        Human
      </button>

      {showLabel ? (
        <span className="sr-only">Current mode: {isAi ? 'AI' : 'Human'}</span>
      ) : null}
    </div>
  );
}
