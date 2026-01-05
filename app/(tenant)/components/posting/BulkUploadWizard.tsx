'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import MediaUploader, { UploadedMedia } from './MediaUploader';
import CarouselBuilder from './CarouselBuilder';
import CaptionEditor from './CaptionEditor';
import SchedulePicker from './SchedulePicker';
import PlatformPreview from './PlatformPreview';
import HashtagSuggestions from './HashtagSuggestions';
import { useDraftAutoSave } from '@/app/(tenant)/hooks/useDraftAutoSave';
import { tenantApi, BulkUploadPost, BulkUploadRequest } from '@/lib/api';
import { addDays, format } from 'date-fns';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
    { id: 1, label: 'Upload Media' },
    { id: 2, label: 'Order & Group' },
    { id: 3, label: 'Edit Captions' },
    { id: 4, label: 'Schedule' },
    { id: 5, label: 'Review' },
];

export default function BulkUploadWizard() {
    const router = useRouter();
    const [step, setStep] = useState<WizardStep>(1);
    const [draftId, setDraftId] = useState<string | null>(null);

    // State
    const [posts, setPosts] = useState<BulkUploadPost[]>([]);
    const [mediaMap, setMediaMap] = useState<Record<string, UploadedMedia>>({});
    const [scheduleMode, setScheduleMode] = useState<'custom' | 'spread' | 'optimal'>('spread');
    const [spreadOptions, setSpreadOptions] = useState<BulkUploadRequest['spread_options']>({
        start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        posts_per_day: 1,
        times: ['09:00'],
        skip_weekends: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-save
    const wizardData = { posts, scheduleMode, spreadOptions, mediaMap };
    useDraftAutoSave(draftId, wizardData, (id) => setDraftId(id));

    // Handlers
    const handleMediaUpload = (uploaded: UploadedMedia[]) => {
        // Add to map
        const newMap = { ...mediaMap };
        uploaded.forEach(m => newMap[m.id] = m);
        setMediaMap(newMap);

        // Create initial posts (1 per media)
        const newPosts: BulkUploadPost[] = uploaded.map(m => ({
            media_ids: [m.id],
            caption: '',
            platforms: ['instagram', 'facebook'], // Default platforms
            name: m.name
        }));

        setPosts([...posts, ...newPosts]);
        // Optionally auto-advance if it's the first upload? No, let user decide.
        // But user might add more.
    };

    const handleCreatePost = async () => {
        try {
            setIsSubmitting(true);
            const payload: BulkUploadRequest = {
                posts,
                schedule_mode: scheduleMode,
                spread_options: scheduleMode === 'spread' ? spreadOptions : undefined
            };

            const res = await tenantApi.createBulkUpload(payload);
            toast.success(`Bulk upload created! ${res.total_posts} posts scheduled.`);
            // Optionally retrieve scheduled details or redirect
            router.push('/campaigns'); // or wherever
        } catch (e: any) {
            toast.error(e.message || 'Failed to create bulk upload');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Steps
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <MediaUploader
                            onUploadComplete={handleMediaUpload}
                            maxFiles={50} // Higher limit for bulk
                            acceptedTypes={["image/*", "video/*"]}
                        />
                        {posts.length > 0 && (
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
                                >
                                    Next: Order & Group ({posts.length} items)
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <CarouselBuilder
                        posts={posts}
                        onChange={setPosts}
                        mediaMap={mediaMap}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Captions</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600">Back</button>
                                <button onClick={() => setStep(4)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Next: Schedule</button>
                            </div>
                        </div>

                        {/* Scrollable list of posts to edit captions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                                {posts.map((post, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative focus-within:ring-2 focus-within:ring-primary/20">
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-500">#{idx + 1}</div>

                                        <div className="flex gap-4 mb-4">
                                            {post.media_ids.slice(0, 3).map(mid => (
                                                <div key={mid} className="h-16 w-16 bg-gray-100 rounded overflow-hidden">
                                                    {mediaMap[mid] && <img src={mediaMap[mid].url} className="h-full w-full object-cover" />}
                                                </div>
                                            ))}
                                            {post.media_ids.length > 3 && <div className="h-16 w-16 flex items-center justify-center bg-gray-50 text-xs text-gray-400">+{post.media_ids.length - 3}</div>}
                                        </div>

                                        <CaptionEditor
                                            value={post.caption}
                                            onChange={(val) => {
                                                const newPosts = [...posts];
                                                newPosts[idx].caption = val;
                                                setPosts(newPosts);
                                            }}
                                            enhanceCaption={false} // Add state for this if needed per post or global
                                            onEnhanceCaptionChange={() => { }}
                                            selectedMediaIds={post.media_ids}
                                            selectedPlatforms={post.platforms}
                                            onAIGenerate={async () => {
                                                // Quick AI logic placeholder
                                                try {
                                                    // Call API slightly different? Or reusable logic.
                                                    // For now simple alert or mock
                                                    const res = await tenantApi.suggestHashtags(post.caption || "Product photo", post.platforms);
                                                    const newCaption = (post.caption ? post.caption + "\n\n" : "") + res.hashtags.join(" ");
                                                    const newPosts = [...posts];
                                                    newPosts[idx].caption = newCaption;
                                                    setPosts(newPosts);
                                                } catch (e) { }
                                            }}
                                        />
                                        <HashtagSuggestions
                                            caption={post.caption}
                                            platforms={post.platforms}
                                            onInsert={(tag) => {
                                                const newPosts = [...posts];
                                                newPosts[idx].caption += " " + tag;
                                                setPosts(newPosts);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Preview Side - Sticky */}
                            <div className="hidden md:block">
                                <div className="sticky top-6">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Preview</h3>
                                    {posts[0] && (
                                        <PlatformPreview
                                            platform={posts[0].platforms[0] as any || 'instagram'}
                                            caption={posts[0].caption}
                                            mediaUrls={posts[0].media_ids.map(id => mediaMap[id]?.url).filter(Boolean)}
                                        />
                                    )}
                                    <p className="text-xs text-center text-gray-400 mt-2">Showing preview for Post #1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold">Scheduling Strategy</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setScheduleMode('spread')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${scheduleMode === 'spread' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="text-2xl block mb-2">📅</span>
                                <span className="font-semibold block">Spread Over Time</span>
                                <span className="text-xs text-gray-500 block">Post consistently every day or week</span>
                            </button>
                            <button
                                onClick={() => setScheduleMode('custom')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${scheduleMode === 'custom' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="text-2xl block mb-2">✏️</span>
                                <span className="font-semibold block">Individual</span>
                                <span className="text-xs text-gray-500 block">Manually set time for each post</span>
                            </button>
                            <button
                                onClick={() => setScheduleMode('optimal')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${scheduleMode === 'optimal' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="text-2xl block mb-2">🤖</span>
                                <span className="font-semibold block">AI Optimal</span>
                                <span className="text-xs text-gray-500 block">Let AI pick the best times (Best reach)</span>
                            </button>
                        </div>

                        {scheduleMode === 'spread' && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={spreadOptions!.start_date}
                                        onChange={(e) => setSpreadOptions({ ...spreadOptions!, start_date: e.target.value })}
                                        className="border rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Posts per day</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={spreadOptions!.posts_per_day}
                                        onChange={(e) => setSpreadOptions({ ...spreadOptions!, posts_per_day: parseInt(e.target.value) })}
                                        className="border rounded-md px-3 py-2 w-24"
                                    />
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={spreadOptions?.skip_weekends}
                                        onChange={(e) => setSpreadOptions({ ...spreadOptions!, skip_weekends: e.target.checked })}
                                    />
                                    <span className="text-sm">Skip Weekends</span>
                                </label>
                            </div>
                        )}

                        {scheduleMode === 'custom' && (
                            <div className="space-y-4">
                                {posts.map((post, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white p-3 border rounded-lg">
                                        <span className="font-mono text-xs h-6 w-6 flex items-center justify-center bg-gray-100 rounded">#{idx + 1}</span>
                                        <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden">
                                            {mediaMap[post.media_ids[0]] && <img src={mediaMap[post.media_ids[0]].url} className="h-full w-full object-cover" />}
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => {
                                                const newPosts = [...posts];
                                                newPosts[idx].scheduled_at = new Date(e.target.value).toISOString();
                                                setPosts(newPosts);
                                            }}
                                            className="border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(3)}
                                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(5)}
                                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
                            >
                                Next: Review
                            </button>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6 max-w-2xl mx-auto text-center">
                        <div className="text-6xl mb-4">🚀</div>
                        <h2 className="text-2xl font-bold">Ready to Launch!</h2>
                        <p className="text-gray-600">
                            You are about to schedule <strong>{posts.length} posts</strong>.
                            <br />
                            Mode: <strong>{scheduleMode === 'spread' ? 'Spread Schedule' : scheduleMode === 'optimal' ? 'AI Optimized' : 'Custom Schedule'}</strong>
                        </p>

                        <div className="bg-gray-50 rounded-xl p-6 text-left max-h-60 overflow-y-auto text-sm border border-gray-200">
                            {posts.map((p, i) => (
                                <div key={i} className="flex justify-between border-b last:border-0 border-gray-200 py-2">
                                    <span className="truncate max-w-[200px]">{p.caption || '(No caption)'}</span>
                                    <span className="text-gray-500">
                                        {p.scheduled_at ? format(new Date(p.scheduled_at), 'MMM d, h:mm a') : 'Auto-schedule'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center gap-4 pt-6">
                            <button
                                onClick={() => setStep(4)}
                                className="rounded-xl px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                                disabled={isSubmitting}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreatePost}
                                disabled={isSubmitting}
                                className="rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule All'}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            {/* Wizard Step Indicator */}
            <div className="mb-8 overflow-x-auto pb-4">
                <div className="flex items-center justify-between min-w-[600px]">
                    {STEPS.map((s, idx) => {
                        const isActive = s.id === step;
                        const isCompleted = s.id < step;
                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none relative">
                                <div className={`flex items-center gap-2 ${isActive ? 'text-primary font-bold' : isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary text-white' : isCompleted ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 bg-white text-gray-400'}`}>
                                        {isCompleted ? '✓' : s.id}
                                    </div>
                                    <span className="whitespace-nowrap">{s.label}</span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`h-0.5 w-full mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
                {renderStepContent()}
            </div>
        </div>
    );
}
