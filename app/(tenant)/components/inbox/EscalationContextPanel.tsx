'use client';

import { useState, useEffect } from 'react';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface EscalationContext {
    id: string;
    type: 'payment' | 'complaint' | 'booking' | 'inquiry' | 'general';
    summary: string;
    key_details: string[];
    primary_action: string;
    [key: string]: any; // For extra fields like booking time, amounts, etc.
}

interface EscalationContextPanelProps {
    escalationId: string;
    onActionComplete?: () => void;
}

export function EscalationContextPanel({ escalationId, onActionComplete }: EscalationContextPanelProps) {
    const [context, setContext] = useState<EscalationContext | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Booking time state
    const [bookingTime, setBookingTime] = useState<string>('');

    useEffect(() => {
        let mounted = true;

        async function fetchContext() {
            if (!escalationId) return;

            try {
                setIsLoading(true);
                setError(null);
                // Using the new API method
                const data = await tenantApi.getEscalationContext(escalationId);
                if (mounted) {
                    setContext(data);
                    // Initialize booking time if present in details or default to now/next hour
                    // For now, we'll leave it empty to force user selection if needed, 
                    // or pre-fill if the API provides a suggested time in metadata.
                }
            } catch (err) {
                if (mounted) {
                    console.error("Failed to fetch escalation context:", err);
                    setError("Failed to load context");
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        fetchContext();

        return () => { mounted = false; };
    }, [escalationId]);

    const handleApprovePayment = async () => {
        try {
            setIsActionLoading(true);
            await tenantApi.approvePayment(escalationId, true); // default sendReceipt = true
            toast.success("Payment approved & receipt sent");
            onActionComplete?.();
        } catch (err) {
            toast.error("Failed to approve payment");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleResolveComplaint = async () => {
        try {
            setIsActionLoading(true);
            await tenantApi.resolveComplaint(escalationId);
            toast.success("Complaint resolved");
            onActionComplete?.();
        } catch (err) {
            toast.error("Failed to resolve complaint");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!bookingTime) {
            toast.error("Please select a time");
            return;
        }
        try {
            setIsActionLoading(true);
            // Ensure ISO string
            const isoTime = new Date(bookingTime).toISOString();
            await tenantApi.confirmBooking(escalationId, isoTime);
            toast.success("Booking confirmed");
            onActionComplete?.();
        } catch (err) {
            toast.error("Failed to confirm booking");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            </div>
        );
    }

    if (error || !context) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                {error || "No context available"}
            </div>
        );
    }

    const getTypeBadgeStyles = (type: string) => {
        switch (type) {
            case 'payment': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'complaint': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'booking': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'inquiry': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'payment': return '💰';
            case 'complaint': return '⚠️';
            case 'booking': return '📅';
            case 'inquiry': return '❓';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="flex flex-col h-full border-l border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeStyles(context.type)}`}>
                    <span>{getTypeIcon(context.type)}</span>
                    <span className="capitalize">{context.type}</span>
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Analysis</h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{context.summary}</p>
                </div>

                {context.key_details && context.key_details.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Key Details</h3>
                        <ul className="space-y-2">
                            {context.key_details.map((detail, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                                    <span>{detail}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Dynamic Actions Area */}
                <div className="mt-auto space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Suggested Actions</h3>

                    {context.type === 'payment' && (
                        <div className="space-y-2">
                            <button
                                onClick={handleApprovePayment}
                                disabled={isActionLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve Payment
                            </button>
                            <button
                                disabled={isActionLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Not Found
                            </button>
                        </div>
                    )}

                    {context.type === 'complaint' && (
                        <div className="space-y-2">
                            <button
                                onClick={handleResolveComplaint}
                                disabled={isActionLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                            >
                                Mark Resolved
                            </button>
                        </div>
                    )}

                    {context.type === 'booking' && (
                        <div className="space-y-2">
                            <input
                                type="datetime-local"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            />
                            <button
                                onClick={handleConfirmBooking}
                                disabled={isActionLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                Confirm Booking
                            </button>
                            <button
                                disabled={isActionLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Propose Time
                            </button>
                        </div>
                    )}

                    {/* Fallback for other types */}
                    {!['payment', 'complaint', 'booking'].includes(context.type) && (
                        <button
                            disabled={isActionLoading}
                            onClick={() => onActionComplete?.()}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
