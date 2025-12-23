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
    <div className="inline-flex items-center rounded-full bg-gray-200 p-1" role="tablist" aria-label="AI mode">
      <button
        type="button"
        role="tab"
        aria-selected={isAi}
        onClick={() => { if (!disabled && onChange) onChange('ai'); }}
        disabled={disabled}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${isAi ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        AI
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={!isAi}
        onClick={() => { if (!disabled && onChange) onChange('human'); }}
        disabled={disabled}
        className={`ml-1 px-3 py-1 rounded-full text-sm font-medium transition ${!isAi ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        Human
      </button>

      {showLabel ? (
        <span className="sr-only">Current mode: {isAi ? 'AI' : 'Human'}</span>
      ) : null}
    </div>
  );
}
