'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { RequirementModal } from './RequirementModal';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { TrashIcon, PencilIcon, DocumentTextIcon, ImageIcon, CalendarIcon } from '../icons';

interface Requirement {
    id: string;
    label: string;
    description: string;
    data_type: string;
    is_active: boolean;
    created_at: string;
}

export function RequirementsList() {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReq, setEditingReq] = useState<Requirement | null>(null);

    const fetchRequirements = useCallback(async () => {
        try {
            const res = await fetch('/api/tenant/requirements', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setRequirements(data.requirements || []);
            }
        } catch (error) {
            console.error('Failed to fetch requirements', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this requirement?')) return;

        try {
            await fetch(`/api/tenant/requirements/${id}`, { method: 'DELETE', credentials: 'include' });
            fetchRequirements();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const openCreateModal = () => {
        setEditingReq(null);
        setIsModalOpen(true);
    };

    const openEditModal = (req: Requirement) => {
        setEditingReq(req);
        setIsModalOpen(true);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'file': return <ImageIcon className="h-4 w-4" />;
            case 'date': return <CalendarIcon className="h-4 w-4" />;
            default: return <DocumentTextIcon className="h-4 w-4" />;
        }
    };

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Requirements Library</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Define questions and file uploads to collect from customers after payment.
                    </p>
                </div>
                <Button onClick={openCreateModal}>+ New Requirement</Button>
            </div>

            {requirements.length === 0 ? (
                <EmptyState
                    title="No requirements defined"
                    description="Create your first requirement to start collecting information."
                    action={{ label: "Create Requirement", onClick: openCreateModal }}
                />
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
                    <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                        {requirements.map((req) => (
                            <li key={req.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-elem-secondary">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                        {getIcon(req.data_type)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{req.label}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {req.description || 'No description'} • <span className="capitalize">{req.data_type}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEditModal(req)}>
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(req.id)}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <RequirementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRequirements}
                requirement={editingReq}
            />
        </div>
    );
}
