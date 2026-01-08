import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    iconOn?: React.ReactNode;
    iconOff?: React.ReactNode;
    activeColor?: string; // Optional custom active color class (e.g. 'bg-green-500')
}

export function Switch({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    iconOn,
    iconOff,
    activeColor = 'bg-gray-700'
}: SwitchProps) {

    // Size configurations
    const sizes = {
        sm: {
            track: 'h-6 w-11',
            thumb: 'h-5 w-5',
            translate: 'translate-x-[22px]', // 11*2 = 22? No. 44px w -> 22px translate. width is 11*4 = 44px? Tailwind w-11 is 2.75rem. 
            // w-11 = 2.75rem = 44px. h-6 = 1.5rem = 24px.
            // Thumb 20px (h-5). Padding 2px. 
            // Translate: 44 - 20 - 4 = 20px. 
            translateVal: 'translate-x-5'
        },
        md: {
            track: 'h-8 w-14', // w-14 = 3.5rem = 56px. h-8 = 2rem = 32px.
            thumb: 'h-7 w-7', // 28px.
            // Padding: (32-28)/2 = 2px check?
            // Translate: 56 - 28 - 4 (padding x 2 approx)? 
            // Actually standard tailwind translation usually is 100% of thumb width or calculated.
            // Let's rely on `translate-x-[calc(100%-4px)]` approach or fixed.
            // 56px width. Thumb 28px. Padding 2px (left) + 2px (right).
            // Left pos: 2px. Right pos: 56 - 28 - 2 = 26px.
            // Delta = 24px.
            translateVal: 'translate-x-6'
        },
        lg: {
            track: 'h-10 w-20',
            thumb: 'h-9 w-9',
            translateVal: 'translate-x-10'
        }
    };

    const currentSize = sizes[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`
        relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${currentSize.track}
        ${checked
                    ? `${activeColor} shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]`
                    : 'bg-gray-200 dark:bg-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
                }
      `}
        >
            <span className="sr-only">Toggle</span>

            {/* Icon in Track (Left) - Visible when Checked */}
            {iconOn && (
                <span className={`absolute left-1.5 top-1.5 transition-opacity duration-200 ${checked ? 'opacity-100' : 'opacity-0'}`}>
                    {iconOn}
                </span>
            )}

            {/* Icon in Track (Right) - Visible when Unchecked */}
            {iconOff && (
                <span className={`absolute right-1.5 top-1.5 transition-opacity duration-200 ${!checked ? 'opacity-100' : 'opacity-0'}`}>
                    {iconOff}
                </span>
            )}

            {/* Thumb */}
            <span
                aria-hidden="true"
                className={`
          pointer-events-none flex items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out
          ${currentSize.thumb}
          ${checked ? currentSize.translateVal : 'translate-x-0'}
          -translate-y-[2px] 
        `}
            >
                {/* Optional: Icon inside thumb if needed, but usually icons are in track for this style */}
            </span>
        </button>
    );
}
