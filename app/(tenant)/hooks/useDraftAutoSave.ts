'use client';

import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const useDraftAutoSave = (
    draftId: string | null,
    data: any,
    onDraftCreated?: (id: string) => void,
    intervalMs = 30000
) => {
    const lastSavedRef = useRef<string>('');

    const saveDraft = useDebouncedCallback(async () => {
        // Basic check for empty data to avoid saving empty drafts initially
        if (!data || (Array.isArray(data.posts) && data.posts.length === 0)) return;

        const serialized = JSON.stringify(data);
        if (serialized === lastSavedRef.current) return;

        try {
            if (draftId) {
                await tenantApi.updateDraft(draftId, { content: data, metadata: { type: 'bulk_upload' } });
            } else {
                const result = await tenantApi.createDraft({
                    key: `bulk_upload_${Date.now()}`,
                    content: data,
                    metadata: { type: 'bulk_upload' }
                });
                if (result && result.id && onDraftCreated) {
                    onDraftCreated(result.id);
                }
            }
            lastSavedRef.current = serialized;
            // Optional: toast.success('Draft saved', { id: 'autosave', duration: 1000 });
        } catch (e) {
            console.error('Auto-save failed:', e);
            // toast.error('Failed to save draft');
        }
    }, intervalMs);

    useEffect(() => {
        saveDraft();
    }, [data, saveDraft]);

    return { saveDraft };
};
