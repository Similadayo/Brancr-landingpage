'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FunnelIcon, XIcon } from '../icons';

type MediaSidebarProps = {
    type: string | undefined;
    onTypeChange: (type: string | undefined) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    availableTags: string[];
    dateRange: 'all' | 'today' | 'week' | 'month';
    onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month') => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
};

const TYPE_OPTIONS = [
    { value: undefined, label: 'All Types', icon: '📁' },
    { value: 'image', label: 'Images', icon: '🖼️' },
    { value: 'video', label: 'Videos', icon: '🎬' },
    { value: 'carousel', label: 'Carousels', icon: '📚' },
];

const DATE_OPTIONS = [
    { value: 'all' as const, label: 'All Time' },
    { value: 'today' as const, label: 'Today' },
    { value: 'week' as const, label: 'This Week' },
    { value: 'month' as const, label: 'This Month' },
];

export function MediaSidebar({
    type,
    onTypeChange,
    selectedTags,
    onTagsChange,
    availableTags,
    dateRange,
    onDateRangeChange,
    isCollapsed,
    onToggleCollapse,
}: MediaSidebarProps) {
    const [expandedSections, setExpandedSections] = useState({
        type: true,
        tags: true,
        date: false,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter((t) => t !== tag));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    const clearAllFilters = () => {
        onTypeChange(undefined);
        onTagsChange([]);
        onDateRangeChange('all');
    };

    const hasActiveFilters = type !== undefined || selectedTags.length > 0 || dateRange !== 'all';

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center py-4 px-2 border-r border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    title="Expand filters"
                >
                    <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                {hasActiveFilters && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary" title="Filters active" />
                )}
            </div>
        );
    }

    return (
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    title="Collapse sidebar"
                >
                    <XIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {/* Clear All */}
            {hasActiveFilters && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Type Section */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => toggleSection('type')}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Type</span>
                    {expandedSections.type ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.type && (
                    <div className="px-4 pb-3 space-y-1">
                        {TYPE_OPTIONS.map((option) => (
                            <button
                                key={option.value ?? 'all'}
                                onClick={() => onTypeChange(option.value)}
                                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition ${type === option.value
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tags Section */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => toggleSection('tags')}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags</span>
                    {expandedSections.tags ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.tags && (
                    <div className="px-4 pb-3">
                        {availableTags.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No tags available</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {availableTags.slice(0, 15).map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${selectedTags.includes(tag)
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {availableTags.length > 15 && (
                                    <span className="px-2.5 py-1 text-xs text-gray-500">
                                        +{availableTags.length - 15} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Date Range Section */}
            <div>
                <button
                    onClick={() => toggleSection('date')}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload Date</span>
                    {expandedSections.date ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.date && (
                    <div className="px-4 pb-3 space-y-1">
                        {DATE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onDateRangeChange(option.value)}
                                className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition ${dateRange === option.value
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
