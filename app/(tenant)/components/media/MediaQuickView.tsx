'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    XIcon,
    TagIcon,
    TrashIcon,
    PencilIcon,
    ArrowDownTrayIcon,
    LinkIcon,
    CalendarIcon,
    PhotoIcon,
} from '../icons';

type MediaAsset = {
    id: number;
    type: 'image' | 'video' | 'carousel';
    name: string;
    caption?: string | null;
    urls: string[];
    url?: string;
    thumbnail_url?: string;
    tags: string[];
    created_at: string;
    updated_at: string;
};

type MediaQuickViewProps = {
    asset: MediaAsset | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: { caption?: string; tags?: string[] }) => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
};

export function MediaQuickView({
    asset,
    onClose,
    onDelete,
    onUpdate,
    isDeleting,
    isUpdating,
}: MediaQuickViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState('');
    const [editTags, setEditTags] = useState('');

    useEffect(() => {
        if (asset) {
            setEditCaption(asset.caption || '');
            setEditTags(asset.tags?.join(', ') || '');
            setIsEditing(false);
        }
    }, [asset]);

    if (!asset) return null;

    const mediaUrl = asset.url || asset.urls?.[0] || '';
    const thumbnailUrl = asset.thumbnail_url || mediaUrl;

    const handleSave = () => {
        const tags = editTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        onUpdate(String(asset.id), { caption: editCaption, tags });
        setIsEditing(false);
    };

    const handleCopyUrl = () => {
        if (mediaUrl) {
            navigator.clipboard.writeText(mediaUrl);
            toast.success('URL copied to clipboard');
        }
    };

    const handleDownload = () => {
        if (mediaUrl) {
            window.open(mediaUrl, '_blank');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <aside className="w-80 shrink-0 border-l border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Details</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    aria-label="Close panel"
                >
                    <XIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {/* Preview */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                {asset.type === 'video' ? (
                    <video
                        src={mediaUrl}
                        controls
                        className="h-full w-full object-contain"
                        preload="metadata"
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailUrl}
                        alt={asset.caption || 'Media preview'}
                        className="h-full w-full object-contain"
                    />
                )}
                <span className="absolute left-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {asset.type}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyUrl}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition"
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                        Copy URL
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition"
                    >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                        Download
                    </button>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                    <div className="flex items-start gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(asset.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <PhotoIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{asset.type}</p>
                        </div>
                    </div>
                </div>

                {/* Caption */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Caption</label>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs text-primary hover:text-primary/80 font-medium transition"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    {isEditing ? (
                        <textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            rows={3}
                            placeholder="Add a caption..."
                        />
                    ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                            {asset.caption || <span className="italic text-gray-400">No caption</span>}
                        </p>
                    )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tags</label>
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="tag1, tag2, tag3"
                        />
                    ) : asset.tags && asset.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {asset.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No tags</p>
                    )}
                </div>

                {/* Edit Actions */}
                {isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditCaption(asset.caption || '');
                                setEditTags(asset.tags?.join(', ') || '');
                            }}
                            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => onDelete(String(asset.id))}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                >
                    <TrashIcon className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Media'}
                </button>
            </div>
        </aside>
    );
}
