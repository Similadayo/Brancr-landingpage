'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi, ServiceKnowledge } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon
} from '@/app/(tenant)/components/icons';
import { KnowledgeModal } from '@/app/(tenant)/components/knowledge/KnowledgeModal';

const CATEGORIES = [
    { value: 'all', label: 'All Items' },
    { value: 'services', label: 'Services & Pricing' },
    { value: 'processes', label: 'Processes & Requirements' },
    { value: 'faqs', label: 'FAQs' },
    { value: 'policies', label: 'Policies' },
];

export default function KnowledgeBasePage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ServiceKnowledge | null>(null);

    // Fetch Knowledge
    const { data: knowledgeItems, isLoading } = useQuery({
        queryKey: ['knowledge', filter],
        queryFn: () => tenantApi.getKnowledge(filter !== 'all' ? { category: filter } : undefined),

        // In a real app we might want to handle error boundaries or loading states more gracefully
        // Initial data could also be hydrated if we were doing SSR
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Omit<ServiceKnowledge, 'id'>) => tenantApi.createKnowledge(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] });
            toast.success('Knowledge item created');
            setIsModalOpen(false);
        },
        onError: () => toast.error('Failed to create item')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<ServiceKnowledge> }) =>
            tenantApi.updateKnowledge(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] });
            toast.success('Knowledge item updated');
            setIsModalOpen(false);
            setEditingItem(null);
        },
        onError: () => toast.error('Failed to update item')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tenantApi.deleteKnowledge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge'] });
            toast.success('Item deleted');
        },
        onError: () => toast.error('Failed to delete item')
    });

    const handleCreate = (data: Omit<ServiceKnowledge, 'id'>) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: Omit<ServiceKnowledge, 'id'>) => {
        if (!editingItem) return;
        updateMutation.mutate({ id: editingItem.id, data });
    };

    const handleEdit = (item: ServiceKnowledge) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredItems = knowledgeItems?.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.keywords?.some(k => k.toLowerCase().includes(query))
        );
    });

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-black overflow-hidden">
            {/* Sidebar Filters */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface p-6 hidden md:block overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-primary" />
                    Knowledge Base
                </h2>
                <nav className="space-y-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilter(cat.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === cat.value
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-elevated'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Items</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your services, FAQs, and policies.</p>
                        </div>

                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Knowledge
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md mb-6">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredItems?.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
                            <p className="text-gray-500 text-sm">Create your first knowledge item to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredItems?.map(item => (
                                <div key={item.id} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg transition-shadow group flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${item.category === 'services' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                item.category === 'processes' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                            {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">{item.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                                        {/* Simple strip HTML for preview - robust sol would use a lib or be careful with XSS if rendering HTML */}
                                        {item.content.replace(/<[^>]*>?/gm, '')}
                                    </p>

                                    {item.keywords && item.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                            {item.keywords.slice(0, 3).map((kw, i) => (
                                                <span key={i} className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">#{kw}</span>
                                            ))}
                                            {item.keywords.length > 3 && (
                                                <span className="text-xs text-gray-400 px-1">+{item.keywords.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <KnowledgeModal
                knowledge={editingItem}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={editingItem ? handleUpdate : handleCreate}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
