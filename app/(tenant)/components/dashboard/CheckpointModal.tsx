'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { Checkpoint } from '@/lib/api';

interface CheckpointModalProps {
    checkpoint: Checkpoint;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { selected_reason: string; free_text?: string; trust_score?: number }) => void;
    isSubmitting: boolean;
}

export function CheckpointModal({ checkpoint, isOpen, onClose, onSubmit, isSubmitting }: CheckpointModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [freeText, setFreeText] = useState('');
    const [trustScore, setTrustScore] = useState<number | null>(null);

    // Reset state when checkpoint changes
    useEffect(() => {
        setSelectedReason(null);
        setFreeText('');
        setTrustScore(null);
    }, [checkpoint]);

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit({
            selected_reason: selectedReason,
            free_text: freeText || undefined,
            trust_score: trustScore || undefined
        });
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="md">
            <ModalTitle className="px-6 pt-6 flex justify-between items-center">
                <span>Quick Checkpoint</span>
            </ModalTitle>

            <ModalBody className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {checkpoint.question}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Your feedback helps improve the AI assistant.
                    </p>
                </div>

                <div className="space-y-3">
                    {checkpoint.options.map((option) => (
                        <label
                            key={option}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedReason === option
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="reason"
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                checked={selectedReason === option}
                                onChange={() => setSelectedReason(option)}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                                {option}
                            </span>
                        </label>
                    ))}

                    <label
                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${selectedReason === 'Other'
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-center h-5">
                            <input
                                type="radio"
                                name="reason"
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                checked={selectedReason === 'Other'}
                                onChange={() => setSelectedReason('Other')}
                            />
                        </div>
                        <div className="ml-3 w-full">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Other</span>
                            {selectedReason === 'Other' && (
                                <input
                                    type="text"
                                    placeholder="Please specify..."
                                    className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-800 dark:border-gray-600"
                                    value={freeText}
                                    onChange={(e) => setFreeText(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                    </label>
                </div>

                {/* Optional Free Text for non-Other options */}
                {selectedReason && selectedReason !== 'Other' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Optional: Any other thoughts?
                        </label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-800 dark:border-gray-600"
                            rows={2}
                            value={freeText}
                            onChange={(e) => setFreeText(e.target.value)}
                        />
                    </div>
                )}

            </ModalBody>

            <ModalFooter className="flex justify-between items-center px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    Skip
                </button>
                <button
                    type="button"
                    disabled={!selectedReason || isSubmitting}
                    onClick={handleSubmit}
                    className="inline-flex justify-center rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </ModalFooter>
        </Modal>
    );
}
