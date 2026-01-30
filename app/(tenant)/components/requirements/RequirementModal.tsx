'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface Requirement {
    id: string;
    label: string;
    description: string;
    data_type: string;
    is_active: boolean;
}

interface RequirementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    requirement?: Requirement | null; // If provided, it's edit mode
}

export function RequirementModal({
    isOpen,
    onClose,
    onSuccess,
    requirement,
}: RequirementModalProps) {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [dataType, setDataType] = useState('text');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (requirement) {
            setLabel(requirement.label);
            setDescription(requirement.description);
            setDataType(requirement.data_type);
        } else {
            // Reset for create mode
            setLabel('');
            setDescription('');
            setDataType('text');
        }
        setError('');
    }, [requirement, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const url = requirement
                ? `/api/tenant/requirements/${requirement.id}`
                : '/api/tenant/requirements';
            const method = requirement ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label,
                    description,
                    data_type: dataType,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to save requirement');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={requirement ? 'Edit Requirement' : 'New Requirement'}
            description="Define a piece of information you need from customers."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Requirement Label <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Upload Passport"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-border dark:bg-dark-surface dark:text-white"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description / Help Text
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain what is needed..."
                        rows={3}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-border dark:bg-dark-surface dark:text-white"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={dataType}
                        onChange={setDataType}
                        options={[
                            { value: 'text', label: 'Text (Short Answer)' },
                            { value: 'file', label: 'File Upload' },
                            { value: 'date', label: 'Date Selection' },
                        ]}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {requirement ? 'Save Changes' : 'Create Requirement'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
