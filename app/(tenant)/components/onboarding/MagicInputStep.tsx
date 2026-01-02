'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { tenantApi, ApiError } from '@/lib/api';
import Image from 'next/image';

type MagicInputStepProps = {
    onComplete: (data: any) => void;
    onSkip: () => void;
    isLoading?: boolean;
};

export function MagicInputStep({ onComplete, onSkip, isLoading }: MagicInputStepProps) {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!url && !description) {
            toast.error('Please enter a website URL or a short description');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await tenantApi.magicProfile({
                url: url.trim() || undefined,
                description: description.trim() || undefined,
            });

            if (result.success) {
                toast.success('Profile generated successfully!');
                onComplete(result.profile);
            } else {
                toast.error(result.message || 'Failed to generate profile');
            }
        } catch (error) {
            console.error('Magic Profile Error:', error);
            if (error instanceof ApiError) {
                toast.error(error.message || 'Failed to generate profile');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-3 rounded-2xl">
                        <svg
                            className="w-8 h-8 text-primary dark:text-purple-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Let&apos;s set up your business
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Enter your website or a short description, and we&apos;ll use AI to magically set up your profile.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Website or Social Media URL <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://instagram.com/yourbusiness"
                            className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                        />
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500 dark:bg-dark-bg dark:text-gray-400">Or describe manually</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        What do you do? <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="We are a boutique coffee shop specializing in artisanal roasts..."
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary resize-none"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!url && !description)}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Analyzing your business...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Auto-Generate Profile</span>
                        </>
                    )}
                </button>

                <button
                    onClick={onSkip}
                    disabled={isGenerating}
                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    Skip to manual setup
                </button>
            </div>
        </div>
    );
}
