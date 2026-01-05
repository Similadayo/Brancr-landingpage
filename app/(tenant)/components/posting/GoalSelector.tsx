'use client';

import React from 'react';
import {
    ShoppingBagIcon,
    MegaphoneIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
} from "../icons";

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
            icon: ShoppingBagIcon,
            description: 'Highlight features and drive sales.',
        },
        {
            id: 'announce',
            title: 'Make an Announcement',
            icon: MegaphoneIcon,
            description: 'Share news, updates, or events.',
        },
        {
            id: 'educate',
            title: 'Educate Audience',
            icon: BookOpenIcon,
            description: 'Share tips, value, or industry insights.',
        },
        {
            id: 'engage',
            title: 'Drive Engagement',
            icon: ChatBubbleLeftRightIcon,
            description: 'Ask questions or start conversations.',
        },
        {
            id: 'custom',
            title: 'Start from Scratch',
            icon: SparklesIcon,
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
                        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            <goal.icon className="h-6 w-6" />
                        </div>
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
