'use client';

import { useState } from 'react';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

type HashtagSuggestionsProps = {
    caption: string;
    onInsert: (tag: string) => void;
    platforms?: string[];
};

export default function HashtagSuggestions({ caption, onInsert, platforms }: HashtagSuggestionsProps) {
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        if (!caption.trim()) {
            toast.error("Please enter a caption first");
            return;
        }
        setLoading(true);
        try {
            const result = await tenantApi.suggestHashtags(caption, platforms, 10);
            setHashtags(result.hashtags);
        } catch (error) {
            toast.error("Failed to get suggestions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hashtag-suggestions border-t border-gray-100 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hashtags</span>
                <button
                    onClick={fetchSuggestions}
                    disabled={loading || !caption}
                    className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full"></span>
                            Loading...
                        </>
                    ) : (
                        <>✨ Suggest</>
                    )}
                </button>
            </div>

            {hashtags.length > 0 && (
                <div className="suggestions-list flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onInsert(tag)}
                            className="hashtag-chip rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
            {hashtags.length === 0 && !loading && (
                <p className="text-xs text-gray-400 italic">Click suggest to generate relevant hashtags.</p>
            )}
        </div>
    );
}
