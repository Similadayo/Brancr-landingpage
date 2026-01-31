'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon } from '../../../components/icons';
import { LoadingState } from '../../../components/ui/LoadingState';

interface RequirementStatus {
    requirement_id: string;
    label: string;
    data_type: string;
    description: string;
    is_required: boolean;
    value?: string;
    submitted_at?: string;
    status: 'pending' | 'submitted';
}

export function FulfillmentStatus({ orderId }: { orderId: string }) {
    const [data, setData] = useState<RequirementStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/tenant/orders/${orderId}/requirements`, { credentials: 'include' });
                if (res.ok) {
                    const json = await res.json();
                    setData(json.requirements_status || []);
                }
            } catch (e) {
                console.error('Failed to fetch fulfillment status', e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [orderId]);

    if (isLoading) return <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />;

    if (data.length === 0) return null;

    const pendingCount = data.filter(d => d.status === 'pending').length;
    const isComplete = pendingCount === 0;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fulfillment Requirements</h2>
                {isComplete ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Complete
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {pendingCount} Pending
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {data.map((req) => (
                    <div key={req.requirement_id} className="relative flex gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                        <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${req.status === 'submitted'
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 bg-white text-transparent dark:border-gray-600 dark:bg-gray-800'
                            }`}>
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                                    {req.label}
                                    {req.is_required && <span className="ml-1 text-red-500">*</span>}
                                </h3>
                                {req.submitted_at && (
                                    <span className="text-xs text-gray-500">
                                        {new Date(req.submitted_at!).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{req.description || 'No description'}</p>

                            {req.status === 'submitted' ? (
                                <div className="mt-2 rounded-lg bg-white p-2.5 text-sm text-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
                                    {req.data_type === 'file' ? (
                                        <a href={req.value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            View Attachment
                                        </a>
                                    ) : (
                                        <div className="whitespace-pre-wrap font-medium">{req.value}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-2 text-xs italic text-gray-400">
                                    Waiting for customer...
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
