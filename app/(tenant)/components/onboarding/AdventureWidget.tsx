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
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['onboarding', 'checklist'],
        queryFn: async () => {
            try {
                const res = await fetch('/api/tenant/onboarding/checklist', { credentials: 'include' });
                if (!res.ok) {
                    if (res.status === 404) return null;
                    throw new Error('Failed to fetch checklist');
                }
                return await res.json();
            } catch (err) {
                return null;
            }
        },
        staleTime: 5000,
        refetchOnMount: 'always',
    });

    if (isLoading || !data) return null;
    if (data.progress >= 100) return null;

    // Helper to fix specific links if needed
    const getActionUrl = (item: ChecklistItem) => {
        // Map known IDs to correct internal routes if API returns bad ones
        const id = item.id.toLowerCase();
        const url = item.action_url?.toLowerCase() || '';

        // Fix Product Link: catch 'product' ID or '/products/create' URL
        if (id.includes('product') || url.includes('products/create')) {
            return '/app/products/new';
        }

        // Fix Service Link
        if (id.includes('service') || url.includes('services/create')) {
            return '/app/services/new';
        }

        // Fix Post/Campaign Link
        if (id.includes('post') || id.includes('campaign') || url.includes('campaigns/create')) {
            return '/app/posts/new';
        }

        // Fix Billing/Upgrade Link
        if (id.includes('upgrade') || id.includes('bill') || id.includes('plan') || url.includes('billing')) {
            return '/app/settings/billing';
        }

        // Fix Integrations
        if (id.includes('telegram') || id.includes('social')) {
            return '/app/integrations';
        }

        return item.action_url;
    };

    const formattedProgress = data.progress.toFixed(1); // 1 decimal place

    return (
        <>
            {/* Backdrop for mobile focus */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl w-[320px] sm:w-[380px] overflow-hidden flex flex-col max-h-[70vh]"
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-primary to-purple-600 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg text-lg backdrop-blur-sm">🗺️</div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Quest Log</h3>
                                        <p className="text-xs text-white/80">Level Up Your Business</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold">{formattedProgress}%</span>
                                </div>
                            </div>

                            {/* Scrollable List */}
                            <div className="overflow-y-auto p-2 space-y-1 bg-gray-50 dark:bg-dark-bg/50">
                                {data.checklist.map((item: ChecklistItem) => (
                                    <div
                                        key={item.id}
                                        className={`p-3 rounded-xl border transition-all ${item.complete
                                            ? 'bg-gray-100/50 border-transparent opacity-70 dark:bg-dark-elevated/30'
                                            : 'bg-white border-gray-200 shadow-sm hover:border-primary/30 dark:bg-dark-surface dark:border-dark-border'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${item.complete
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {item.complete && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm font-semibold ${item.complete ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {item.title}
                                                    </p>
                                                    {item.xp > 0 && !item.complete && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 whitespace-nowrap">
                                                            {item.xp} XP
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                                    {item.description}
                                                </p>

                                                {!item.complete && (
                                                    <div className="mt-2.5 flex justify-end">
                                                        {item.id === 'telegram_connected' ? (
                                                            <TelegramConnectButton variant="inline" />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    router.push(getActionUrl(item));
                                                                }}
                                                                className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                                                            >
                                                                Start Quest
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative bg-gradient-to-br from-primary to-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-dark-bg z-50 overflow-hidden"
                >
                    {/* Progress Ring Background could go here, but simple icon is cleaner */}
                    <span className="text-2xl pt-1">🗺️</span>

                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-dark-bg">
                        {Math.floor(data.progress)}%
                    </div>
                </motion.button>
            </div>
        </>
    );
}
