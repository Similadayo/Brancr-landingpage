'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { ServiceKnowledge } from '@/lib/api';

interface KnowledgeModalProps {
    knowledge?: ServiceKnowledge | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ServiceKnowledge, 'id'>) => void;
    isSubmitting: boolean;
}

const CATEGORIES = [
    { value: 'services', label: 'Services & Pricing' },
    { value: 'processes', label: 'Processes & Requirements' },
    { value: 'faqs', label: 'FAQs' },
    { value: 'policies', label: 'Policies' },
];

export function KnowledgeModal({ knowledge, isOpen, onClose, onSubmit, isSubmitting }: KnowledgeModalProps) {
    const [form, setForm] = useState<Partial<Omit<ServiceKnowledge, 'id'>>>({
        category: 'services',
        title: '',
        content: '',
        keywords: [],
        isActive: true,
    });

    const [keywordInput, setKeywordInput] = useState('');

    // Populate form on edit
    useEffect(() => {
        if (knowledge) {
            setForm({
                category: knowledge.category,
                title: knowledge.title,
                content: knowledge.content,
                keywords: knowledge.keywords,
                isActive: knowledge.isActive,
            });
        } else {
            // Reset defaults for new item
            setForm({
                category: 'services',
                title: '',
                content: '',
                keywords: [],
                isActive: true,
            });
            setKeywordInput('');
        }
    }, [knowledge, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) return;

        onSubmit({
            category: form.category as any,
            title: form.title!,
            content: form.content!,
            keywords: form.keywords || [],
            isActive: form.isActive ?? true,
        });
    };

    const addKeyword = () => {
        if (!keywordInput.trim()) return;
        setForm(prev => ({
            ...prev,
            keywords: [...(prev.keywords || []), keywordInput.trim()]
        }));
        setKeywordInput('');
    };

    const removeKeyword = (index: number) => {
        setForm(prev => ({
            ...prev,
            keywords: (prev.keywords || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="lg">
            <form onSubmit={handleSubmit}>
                <ModalTitle className="px-6 pt-6 flex justify-between items-center">
                    <span>{knowledge ? 'Edit Knowledge' : 'Add Knowledge'}</span>
                </ModalTitle>

                <ModalBody className="space-y-5 px-6 py-4">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. UK Admission Support Package"
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            {/* Toolbar Placeholder (Visual only since no rich text yet) */}
                            <div className="flex gap-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>[B]</span> <span>[I]</span> <span>[List]</span> <span>(Rich text coming soon)</span>
                            </div>
                            <textarea
                                required
                                rows={8}
                                placeholder="Enter the details here..."
                                className="block w-full rounded-b-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3"
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            You can paste formatted text or type directly.
                        </p>
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keywords
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Add a keyword..."
                                className="block flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                            />
                            <button
                                type="button"
                                onClick={addKeyword}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.keywords?.map((kw, i) => (
                                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                    {kw}
                                    <button type="button" onClick={() => removeKeyword(i)} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                </ModalBody>

                <ModalFooter className="flex justify-between items-center px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Knowledge'}
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
