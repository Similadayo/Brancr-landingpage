'use client';

import React from 'react';

type AIToggleProps = {
  value: 'ai' | 'human';
  onChange?: (next: 'ai' | 'human') => void;
  disabled?: boolean;
  showLabel?: boolean;
};

import { Switch } from './ui/Switch';

export default function AIToggle({ value, onChange, disabled = false, showLabel = true }: AIToggleProps) {
  const isAi = value === 'ai';

  const handleToggle = (checked: boolean) => {
    if (onChange) onChange(checked ? 'ai' : 'human');
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isAi}
        onChange={handleToggle}
        disabled={disabled}
        size="md"
        activeColor="bg-primary dark:bg-dark-accent-primary"
        iconOn={<span className="text-[10px] font-bold text-white uppercase ml-1">AI</span>}
        iconOff={<span className="text-[10px] font-bold text-gray-500 uppercase mr-1">HU</span>}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isAi ? 'AI Mode' : 'Human Mode'}
        </span>
      )}
    </div>
  );
}
