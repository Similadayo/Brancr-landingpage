'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ChecklistItem = {
    id: string;
    title: string;
    description: string;
    complete: boolean;
    action_url: string;
    icon: string;
    xp: number;
};

type ChecklistData = {
    checklist: ChecklistItem[];
    progress: number;
    earned_xp: number;
    total_xp: number;
};

export function AdventureWidget() {
    const [data, setData] = useState<ChecklistData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const res = await fetch('/api/tenant/onboarding/checklist', {
                    credentials: 'include',
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to load checklist:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChecklist();
    }, []);

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-dark-border rounded w-1/3 mb-4" />
                <div className="h-2 bg-gray-200 dark:bg-dark-border rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-dark-border rounded" />
                    ))}
                </div>
            </div>
        );
    }

    // Hide when complete
    if (!data || data.progress >= 100) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Getting Started</h3>
                </div>
                <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {data.earned_xp} / {data.total_xp} XP
                </span>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-dark-bg">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{data.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${data.progress}%` }}
                    />
                </div>
            </div>

            {/* Tasks */}
            <ul className="divide-y divide-gray-100 dark:divide-dark-border">
                {data.checklist.map((item) => (
                    <li
                        key={item.id}
                        className={`px-6 py-4 flex items-center gap-4 ${item.complete ? 'opacity-60' : ''
                            }`}
                    >
                        <span className="text-2xl">{item.complete ? '✅' : item.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-gray-900 dark:text-white ${item.complete ? 'line-through' : ''}`}>
                                {item.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {item.description}
                            </p>
                        </div>
                        {!item.complete && (
                            <Link
                                href={item.action_url}
                                className="text-sm font-medium text-primary hover:underline shrink-0"
                            >
                                Start →
                            </Link>
                        )}
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                            +{item.xp} XP
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
