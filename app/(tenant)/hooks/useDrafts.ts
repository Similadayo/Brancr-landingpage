'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { tenantApi } from '@/lib/api';

type Draft = {
  id: string;
  key: string;
  content: any;
  metadata?: any;
  owner_id?: number;
  created_at: string;
  updated_at: string;
};

export const DRAFT_KEYS = {
  POST_CREATE: 'post_create_draft',
  PRODUCT_CREATE: 'product_create_draft',
  SERVICE_CREATE: 'service_create_draft',
  MENU_ITEM_CREATE: 'menu_item_create_draft',
} as const;

export function parseDraftContent<T>(draft: Draft | null | undefined): T | null {
  if (!draft || !draft.content) return null;
  return draft.content as T;
}

// Internal Hook for shared logic
function useDraftSync(key: string) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Helper: retry with exponential backoff + jitter
  const attemptWithRetry = useCallback(async (fn: () => Promise<any>, maxAttempts = 4) => {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (e) {
        attempt += 1;
        const base = Math.pow(2, attempt) * 250;
        const jitter = Math.floor(Math.random() * 200);
        await new Promise((res) => setTimeout(res, base + jitter));
      }
    }
    throw new Error('Max retry attempts reached');
  }, []);

  const OUTBOX_KEY = `drafts-outbox-${key}`;

  const loadOutbox = useCallback(() => {
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) as any[] : [];
    } catch { return []; }
  }, [OUTBOX_KEY]);

  const saveOutbox = useCallback((outbox: any[]) => {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); } catch { }
  }, [OUTBOX_KEY]);

  const enqueue = useCallback((action: any) => {
    const outbox = loadOutbox();
    outbox.push({ attempts: 0, ...action });
    saveOutbox(outbox);
  }, [loadOutbox, saveOutbox]);

  const processOutbox = useCallback(async () => {
    const outbox = loadOutbox();
    if (!outbox.length) return;

    const remaining: any[] = [];

    for (const item of outbox) {
      try {
        if (item.type === 'upsert') {
          if (!item.id) {
            const created: any = await attemptWithRetry(() => tenantApi.createDraft({
              key,
              content: item.content,
              metadata: item.metadata,
              owner_id: item.ownerId
            }));
            item.id = created.id;
            setDraftId(created.id);
            setLastSyncedAt(new Date(created.updated_at).getTime());
            try { localStorage.setItem(`drafts-local-${key}`, JSON.stringify({ draftId: created.id })); } catch { }
          } else {
            const updated: any = await attemptWithRetry(() => tenantApi.updateDraft(item.id, {
              content: item.content,
              metadata: item.metadata
            }));
            setLastSyncedAt(new Date(updated.updated_at).getTime());
          }
        } else if (item.type === 'delete') {
          if (item.id) {
            await attemptWithRetry(() => tenantApi.deleteDraft(item.id));
            if (draftId === item.id) {
              setDraftId(null);
              setLastSyncedAt(null);
            }
          }
        }
        // Notify others
        try { window.dispatchEvent(new CustomEvent(`drafts-changed-${key}`)); } catch { }
      } catch (e) {
        item.attempts = (item.attempts || 0) + 1;
        if (item.attempts < 4) remaining.push(item);
      }
    }

    if (remaining.length !== outbox.length) saveOutbox(remaining);
  }, [loadOutbox, saveOutbox, attemptWithRetry, key, draftId]);

  useEffect(() => {
    // Initial Load of ID from local snapshot
    try {
      const raw = localStorage.getItem(`drafts-local-${key}`);
      if (raw) {
        const snap = JSON.parse(raw);
        if (snap.draftId) setDraftId(snap.draftId);
      }
    } catch { }

    const interval = setInterval(() => void processOutbox(), 5000);
    const onOnline = () => void processOutbox();
    window.addEventListener('online', onOnline);
    void processOutbox();
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, [processOutbox, key]);

  return { draftId, setDraftId, enqueue, processOutbox };
}

export function useDraft(key: string) {
  const [data, setData] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDraft = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await tenantApi.getDrafts(key);
      const drafts = res?.drafts || [];
      if (Array.isArray(drafts) && drafts.length > 0) {
        drafts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setData(drafts[0]);
      } else {
        // Try local fallback
        try {
          const raw = localStorage.getItem(`drafts-local-content-${key}`);
          if (raw) setData(JSON.parse(raw));
        } catch { }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  return { data, isLoading, refetch: fetchDraft };
}

export function useAutoSaveDraft(key: string, content: any, enabled: boolean = true) {
  const [isSaving, setIsSaving] = useState(false);
  const { draftId, setDraftId, enqueue, processOutbox } = useDraftSync(key);
  const debouncedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !content) return;

    // Save local snapshot immediately
    try { localStorage.setItem(`drafts-local-content-${key}`, JSON.stringify({ content, updated_at: new Date().toISOString() })); } catch { }

    setIsSaving(true);
    if (debouncedRef.current) clearTimeout(debouncedRef.current);

    debouncedRef.current = window.setTimeout(async () => {
      enqueue({ type: 'upsert', id: draftId, content });
      setIsSaving(false); // Optimistic
    }, 2000); // 2s debounce

    return () => { if (debouncedRef.current) clearTimeout(debouncedRef.current); };
  }, [content, enabled, key, draftId, enqueue]);

  return { isSaving, draftId, setDraftId };
}

export function useDeleteDraft() {
  const mutate = async (id: string) => {
    try {
      await tenantApi.deleteDraft(id);
    } catch (e) {
      console.error("Failed to delete draft", e);
    }
  };
  return { mutate };
}

// Backward compatibility (deprecated)
export default function useAutosaveDraft(opts: any) {
  const { data } = useDraft(opts.key);
  const { isSaving } = useAutoSaveDraft(opts.key, opts.initialContent);
  return { content: data?.content, status: isSaving ? 'saving' : 'saved', ...useDraftSync(opts.key) };
}
