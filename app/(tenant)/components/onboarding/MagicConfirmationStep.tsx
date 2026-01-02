'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { tenantApi, ApiError } from '@/lib/api';
import { useSetTenantIndustry, useIndustries } from '../../hooks/useIndustry';

type MagicProfileData = {
    name: string;
    description: string;
    industry: string; // This expects an industry key or name, we'll need to map it or handle mapping backend side
    persona: {
        tone: string;
        audience: string;
        values: string[];
    };
    confidence: "high" | "medium" | "low";
};

type MagicConfirmationStepProps = {
    data: MagicProfileData;
    onComplete: () => void;
    onBack: () => void;
    isLoading?: boolean;
};

export function MagicConfirmationStep({ data, onComplete, onBack, isLoading }: MagicConfirmationStepProps) {
    const [name, setName] = useState(data.name);
    const [description, setDescription] = useState(data.description);
    const [isSaving, setIsSaving] = useState(false);

    // Note: Persona fields are displayed but handled via bulk update, 
    // currently we only allow simple edits to name/desc here for speed.
    // Advanced editing can be done in settings later.

    const { data: industries = [] } = useIndustries();

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            // 1. Save Business Profile
            await tenantApi.onboardingBusinessProfile({
                name: name.trim(),
                description: description.trim(),
                industry: data.industry,
                location: "Online", // Defaulting to Online for magic profile flow if not captured
            });

            // 2. Save Industry
            // Find matching industry by name (case-insensitive) to get the ID
            const matchedIndustry = industries.find(
                (ind) => ind.name.toLowerCase() === data.industry.toLowerCase()
            );

            if (matchedIndustry) {
                await tenantApi.onboardingIndustry({ industry_id: matchedIndustry.id });
            } else {
                console.warn("Could not map magic industry to ID:", data.industry);
                // Try to persist the string industry name if possible, or fall back to 'Other' if we can guess it?
                // For now, if we can't map it, we skip the explicit industry step save.
                // The user logic might need to revisit this in Settings later.
            }

            // 3. Save Persona
            await tenantApi.onboardingPersona({
                tone: data.persona.tone,
                audience: data.persona.audience,
                values: data.persona.values,
            });

            toast.success('Profile confirmed!');
            onComplete();

        } catch (error) {
            console.error('Confirmation Error:', error);
            toast.error('Failed to save profile details');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    We found this for you
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Review the details below. You can edit them now or change them later in settings.
                </p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-dark-bg dark:border-dark-border dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-dark-bg dark:border-dark-border dark:text-white resize-none"
                    />
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Insights</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Industry:</span>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{data.industry}</p>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Tone:</span>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{data.persona.tone}</p>
                        </div>
                    </div>
                </div>
            </div>

            {data.confidence === 'low' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        We couldn&apos;t find much public info about your business. Please review the details carefully.
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-surface"
                >
                    Back
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isSaving ? 'Saving...' : 'Confirm & Continue'}
                </button>
            </div>
        </div>
    );
}
