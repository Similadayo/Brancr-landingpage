'use client';

import { addHours, addDays, setHours, addWeeks } from 'date-fns';

type QuickTimePresetsProps = {
    onSelect: (date: Date | 'now') => void;
};

const presets = [
    { label: 'Post Now', value: 'now' },
    { label: 'In 1 Hour', getTime: () => addHours(new Date(), 1) },
    { label: 'Tomorrow 9am', getTime: () => setHours(addDays(new Date(), 1), 9) },
    { label: 'Next Week', getTime: () => addWeeks(new Date(), 1) },
];

export default function QuickTimePresets({ onSelect }: QuickTimePresetsProps) {
    return (
        <div className="quick-presets flex flex-wrap gap-2">
            {presets.map((preset) => (
                <button
                    key={preset.label}
                    onClick={() => onSelect(preset.value === 'now' ? 'now' : preset.getTime!())}
                    className="preset-btn rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                    {preset.label}
                </button>
            ))}
        </div>
    );
}
