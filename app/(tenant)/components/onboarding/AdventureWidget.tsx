'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckCircleIcon } from '../icons';

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

import TelegramConnectButton from './../TelegramConnectButton';

export function AdventureWidget() {
    const [minimized, setMinimized] = useState(false);
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['onboarding', 'checklist'],
        queryFn: async () => {
            try {
                const res = await fetch('/api/tenant/onboarding/checklist');
                if (!res.ok) {
                    // Handle 404 gracefully if endpoint not ready
                    if (res.status === 404) return null;
                    throw new Error('Failed to fetch checklist');
                }
                return await res.json();
            } catch (err) {
                return null;
            }
        },
        // Don't refetch too often
        // Check for updates frequently for a responsive feel
        staleTime: 5000,
        refetchOnMount: 'always',
    });

    if (isLoading || !data) return null;
    if (data.progress >= 100) return null;

    return (
        <AnimatePresence>
            {!minimized ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-lg overflow-hidden mb-8"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-dark-elevated dark:to-dark-surface">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl text-xl">🗺️</div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Your Adventure Checklist</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Complete these quests to level up your business!</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary">{data.progress}%</span>
                                <p className="text-[10px] text-gray-400 uppercase font-tracking-wider font-semibold">Ready</p>
                            </div>
                            <button
                                onClick={() => setMinimized(true)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Minimize widget"
                            >
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-gray-50 dark:divide-dark-border">
                        {data.checklist.map((item: ChecklistItem) => (
                            <div
                                key={item.id}
                                className={`p-4 flex items-center justify-between group transition-colors ${item.complete ? 'bg-gray-50/50 dark:bg-dark-bg/30' : 'hover:bg-gray-50 dark:hover:bg-dark-elevated/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center border transition-all
                    ${item.complete
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-transparent group-hover:border-primary/50'
                                        }
                  `}>
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                    <div className={item.complete ? 'opacity-50 line-through grayscale' : ''}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{item.icon}</span>
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">{item.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!item.complete && (
                                        <>
                                            {item.id === 'telegram_connected' ? (
                                                <TelegramConnectButton variant="inline" />
                                            ) : (
                                                <button
                                                    onClick={() => router.push(item.action_url)}
                                                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-elevated hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                                                >
                                                    Start Quest
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {item.xp > 0 && (
                                        <span className={`
                      text-xs font-bold px-2 py-1 rounded-full
                      ${item.complete
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }
                    `}>
                                            +{item.xp} XP
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setMinimized(false)}
                    className="bg-white dark:bg-dark-surface rounded-full shadow-lg border border-gray-100 dark:border-dark-border p-3 flex items-center gap-3 hover:scale-105 transition-transform mb-8"
                >
                    <div className="bg-gradient-to-br from-primary to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner">
                        🗺️
                    </div>
                    <div className="text-left pr-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Adventure Progress</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{data.progress}% Complete</p>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
