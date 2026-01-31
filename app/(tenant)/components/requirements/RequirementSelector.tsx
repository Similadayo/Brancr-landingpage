'use client';

import { useState, useEffect } from 'react';
import { LoadingState } from '../ui/LoadingState';

interface Requirement {
    id: string;
    label: string;
    description: string;
    data_type: string;
}

interface RequirementSelectorProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export function RequirementSelector({ selectedIds, onChange }: RequirementSelectorProps) {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReqs() {
            try {
                const res = await fetch('/api/tenant/requirements', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setRequirements(data.requirements || []);
                }
            } catch (e) {
                console.error('Failed to load requirements', e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReqs();
    }, []);

    const toggleReq = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    if (isLoading) return <LoadingState />;

    if (requirements.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                No requirements defined. Go to Settings &gt; Requirements to add some.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requirements.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                return (
                    <div
                        key={req.id}
                        onClick={() => toggleReq(req.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                            }`}
                    >
                        <div>
                            <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                {req.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {req.description || 'No description'} ({req.data_type})
                            </div>
                        </div>
                        <div
                            className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                                }`}
                        >
                            {isSelected && (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
