'use client';

import React from 'react';

type Goal = 'promote' | 'announce' | 'educate' | 'engage' | 'custom';

interface GoalSelectorProps {
    selectedGoal: string | null;
    onSelect: (goal: string) => void;
}

export default function GoalSelector({ selectedGoal, onSelect }: GoalSelectorProps) {
    const goals = [
        {
            id: 'promote',
            title: 'Promote a Product/Service',
            icon: '🛍️',
            description: 'Highlight features and drive sales.',
        },
        {
            id: 'announce',
            title: 'Make an Announcement',
            icon: '📢',
            description: 'Share news, updates, or events.',
        },
        {
            id: 'educate',
            title: 'Educate Audience',
            icon: '📚',
            description: 'Share tips, value, or industry insights.',
        },
        {
            id: 'engage',
            title: 'Drive Engagement',
            icon: '💬',
            description: 'Ask questions or start conversations.',
        },
        {
            id: 'custom',
            title: 'Start from Scratch',
            icon: '✨',
            description: 'Create a post without a specific template.',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                    <button
                        key={goal.id}
                        onClick={() => onSelect(goal.id)}
                        className={`group relative flex flex-col items-start rounded-xl border p-5 text-left transition-all hover:shadow-md ${isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="mb-3 text-3xl">{goal.icon}</div>
                        <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                            {goal.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {goal.description}
                        </p>

                        {isSelected && (
                            <div className="absolute right-3 top-3">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
