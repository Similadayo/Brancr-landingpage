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

type UseAutosaveOptions = {
  key: string;
  initialContent?: any;
  metadata?: any;
  debounceMs?: number;
  ownerId?: number;
  onRemoteNewer?: (remote: Draft) => void;
};

export function useAutosaveDraft({ key, initialContent = {}, metadata, debounceMs = 1000, ownerId, onRemoteNewer }: UseAutosaveOptions) {
  const [content, setContent] = useState<any>(initialContent);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const debouncedRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  // Load latest draft on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await tenantApi.getDrafts(key);
        const drafts = (res as any)?.drafts || [];
        if (!Array.isArray(drafts) || drafts.length === 0) return;
        // Pick the most recent by updated_at
        drafts.sort((a: Draft, b: Draft) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const latest: Draft = drafts[0];
        if (!mounted) return;
        // If there is existing remote draft, set draftId and make content available
        setDraftId(latest.id);
        setLastSyncedAt(new Date(latest.updated_at).getTime());
        // Do not overwrite local content automatically — surface remote availability
        if (JSON.stringify(initialContent) !== JSON.stringify(latest.content)) {
          // We have a differing remote draft
          onRemoteNewer?.(latest);
        }
      } catch (e) {
        // ignore — not critical
        // console.debug('Failed to fetch drafts:', e);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Debounced save
  useEffect(() => {
    // Do not autosave if content is undefined
    if (content === undefined) return;
    pendingRef.current = true;
    setStatus('saving');
    if (debouncedRef.current) window.clearTimeout(debouncedRef.current);
    debouncedRef.current = window.setTimeout(async () => {
      try {
        if (!draftId) {
          // create
          const payload: any = { key, content, metadata };
          if (ownerId) payload.owner_id = ownerId;
          const created = await tenantApi.createDraft(payload);
          setDraftId((created as any).id);
          setLastSyncedAt(new Date((created as any).updated_at).getTime());
          setStatus('saved');
        } else {
          // update
          const updated = await tenantApi.updateDraft(draftId, { content, metadata });
          const updatedAt = new Date((updated as any).updated_at).getTime();
          // detect remote conflicts (if remote updated_at > lastSyncedAt before our save)
          if (lastSyncedAt && updatedAt > lastSyncedAt + 3000) {
            setStatus('conflict');
            onRemoteNewer?.(updated as Draft);
          } else {
            setStatus('saved');
            setLastSyncedAt(updatedAt);
          }
        }
      } catch (err) {
        setStatus('error');
      } finally {
        pendingRef.current = false;
      }
    }, debounceMs);

    return () => {
      if (debouncedRef.current) window.clearTimeout(debouncedRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, draftId, key]);

  const restoreRemote = useCallback(async (id: string) => {
    try {
      const res = await tenantApi.getDraft(id);
      setContent((res as any).content);
      setDraftId((res as any).id);
      setLastSyncedAt(new Date((res as any).updated_at).getTime());
      setStatus('saved');
    } catch (e) {
      // ignore
    }
  }, []);

  const manualSave = useCallback(async (payloadContent?: any) => {
    const payload = payloadContent ?? content;
    try {
      setStatus('saving');
      if (!draftId) {
        const created = await tenantApi.createDraft({ key, content: payload, metadata, owner_id: ownerId });
        setDraftId((created as any).id);
        setLastSyncedAt(new Date((created as any).updated_at).getTime());
      } else {
        const updated = await tenantApi.updateDraft(draftId, { content: payload, metadata });
        setLastSyncedAt(new Date((updated as any).updated_at).getTime());
      }
      setStatus('saved');
    } catch (e) {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, draftId, key]);

  return {
    content,
    setContent,
    status,
    draftId,
    lastSyncedAt,
    restoreRemote,
    manualSave,
  } as const;
}

export default useAutosaveDraft;
