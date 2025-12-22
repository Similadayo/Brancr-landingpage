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
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isAi}
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none ${
          isAi ? 'bg-primary' : 'bg-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} h-7 w-12`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isAi ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      {showLabel ? <span className="text-sm font-medium text-gray-900">{isAi ? 'AI' : 'Human'}</span> : null}
    </div>
  );
}
