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
    <div className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-800 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" role="tablist" aria-label="AI mode">
      <button
        type="button"
        role="tab"
        aria-selected={isAi}
        onClick={() => { if (!disabled && onChange) onChange('ai'); }}
        disabled={disabled}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isAi
            ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md transform scale-[1.02]'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        AI
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={!isAi}
        onClick={() => { if (!disabled && onChange) onChange('human'); }}
        disabled={disabled}
        className={`ml-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${!isAi
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md transform scale-[1.02]'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        Human
      </button>

      {showLabel ? (
        <span className="sr-only">Current mode: {isAi ? 'AI' : 'Human'}</span>
      ) : null}
    </div>
  );
}
