'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedMedia } from './MediaUploader';
import { BulkUploadPost } from '@/lib/api';

type CarouselBuilderProps = {
    posts: BulkUploadPost[];
    onChange: (posts: BulkUploadPost[]) => void;
    mediaMap: Record<string, UploadedMedia>;
    onNext: () => void;
    onBack: () => void;
};

// Sortable Item Component
const SortableMediaItem = ({ id, url, name }: { id: string; url: string; name?: string }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative group h-24 w-24 flex-shrink-0 cursor-grab overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm active:cursor-grabbing hover:border-primary"
        >
            {url.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={url} className="h-full w-full object-cover" />
            ) : (
                <img src={url} alt={name || 'Media'} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
    );
};

export default function CarouselBuilder({
    posts,
    onChange,
    mediaMap,
    onNext,
    onBack,
}: CarouselBuilderProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        // Find source and destination posts
        let sourcePostIndex = -1;
        let destPostIndex = -1;

        posts.forEach((post, index) => {
            if (post.media_ids.includes(activeId)) sourcePostIndex = index;
            if (post.media_ids.includes(overId)) destPostIndex = index;
        });

        // If both in the same post (reordering)
        if (sourcePostIndex === destPostIndex && sourcePostIndex !== -1) {
            const newPosts = [...posts];
            const post = newPosts[sourcePostIndex];
            const oldIndex = post.media_ids.indexOf(activeId);
            const newIndex = post.media_ids.indexOf(overId);

            post.media_ids = arrayMove(post.media_ids, oldIndex, newIndex);
            onChange(newPosts);
            return;
        }

        // Dragging between posts (not implemented fully in this simplified view without a droppable container logic for posts, 
        // but the sortable context strategy usually handles list reordering. 
        // To support drag BETWEEN lists (posts), we need unique IDs for all items across all lists, which we have (media IDs).
        // Dnd-kit handles this if all SortableContexts are under the same DndContext.
        // However, we need to locate which list the overId belongs to.

        // If we dragged to a different post's item
        if (sourcePostIndex !== -1 && destPostIndex !== -1) {
            const newPosts = [...posts];
            const sourcePost = newPosts[sourcePostIndex];
            const destPost = newPosts[destPostIndex];

            // Remove from source
            sourcePost.media_ids = sourcePost.media_ids.filter(id => id !== activeId);

            // Add to dest (at the position of overId)
            const overIndex = destPost.media_ids.indexOf(overId);
            // Determine if we drop before or after based on transform? 
            // Simplified: always insert before
            destPost.media_ids.splice(overIndex, 0, activeId);

            // Clean up empty posts if desired? No, let user delete them manually if UI allows.
            // But if source becomes empty, maybe we should auto-delete it?
            if (sourcePost.media_ids.length === 0) {
                newPosts.splice(sourcePostIndex, 1);
            }

            onChange(newPosts);
        }
    };

    const mergeDown = (index: number) => {
        if (index >= posts.length - 1) return;
        const newPosts = [...posts];
        const current = newPosts[index];
        const next = newPosts[index + 1];

        current.media_ids = [...current.media_ids, ...next.media_ids];
        newPosts.splice(index + 1, 1);
        onChange(newPosts);
    };

    const splitPost = (postIndex: number, mediaIndex: number) => {
        // Split specific media out into a new post
        const newPosts = [...posts];
        const post = newPosts[postIndex];
        if (post.media_ids.length <= 1) return;

        const mediaToSplit = post.media_ids[mediaIndex];
        post.media_ids = post.media_ids.filter((_, i) => i !== mediaIndex);

        // Insert new post after current
        newPosts.splice(postIndex + 1, 0, {
            ...post, // Copy other props like caption? Or reset?
            caption: '', // Reset caption for new post typically
            media_ids: [mediaToSplit],
            name: `Post ${newPosts.length + 1}` // Temp name
        });

        onChange(newPosts);
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Organize Posts</h2>
                <p className="mb-6 text-sm text-gray-500">
                    Drag and drop media to reorder or re-group them into carousels. Each row represents one post.
                </p>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="space-y-4">
                        {posts.map((post, postIndex) => (
                            <div key={postIndex} className="relative rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-300">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Post {postIndex + 1} {post.media_ids.length > 1 && '(Carousel)'}
                                    </span>
                                    {postIndex < posts.length - 1 && (
                                        <button
                                            onClick={() => mergeDown(postIndex)}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            ⬇ Merge with next
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                    <SortableContext
                                        items={post.media_ids}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {post.media_ids.map((mediaId, mediaIndex) => {
                                            const media = mediaMap[mediaId];
                                            if (!media) return null;
                                            return (
                                                <div key={mediaId} className="relative group">
                                                    <SortableMediaItem
                                                        id={mediaId}
                                                        url={media.url || media.thumbnail_url || ''}
                                                        name={media.name}
                                                    />
                                                    {/* Split Button overlay for items in a carousel */}
                                                    {post.media_ids.length > 1 && (
                                                        <button
                                                            onClick={() => splitPost(postIndex, mediaIndex)}
                                                            className="absolute -top-2 -right-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:text-red-600 group-hover:flex"
                                                            title="Split into new post"
                                                        >
                                                            ✂️
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </SortableContext>
                                    {post.media_ids.length === 0 && (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeId ? (
                            <div className="h-24 w-24 overflow-hidden rounded-lg border-2 border-primary shadow-xl">
                                {(() => {
                                    const media = mediaMap[activeId];
                                    return media ? <img src={media.url} className="h-full w-full object-cover" /> : null
                                })()}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
                >
                    Next: Add Captions
                </button>
            </div>
        </div>
    );
}
