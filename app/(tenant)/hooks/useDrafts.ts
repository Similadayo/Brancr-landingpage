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
        if (Array.isArray(drafts) && drafts.length > 0) {
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
          return;
        }

        // If no server drafts, fall back to local snapshot if available
        try {
          const raw = localStorage.getItem(`drafts-local-${key}`);
          if (raw) {
            const snap = JSON.parse(raw);
            if (snap?.draftId) {
              setDraftId(snap.draftId);
            }
            if (snap?.lastSyncedAt) {
              setLastSyncedAt(snap.lastSyncedAt);
            }
            // Do not overwrite content automatically
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore — not critical
        // console.debug('Failed to fetch drafts:', e);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist local snapshot immediately for fast restore and offline fallback
  useEffect(() => {
    try {
      const snapshot = { content, metadata, draftId, lastSyncedAt, updatedAt: Date.now() };
      localStorage.setItem(`drafts-local-${key}`, JSON.stringify(snapshot));
    } catch (e) {
      // ignore
    }
  }, [content, metadata, draftId, lastSyncedAt, key]);

  // Helper: retry with exponential backoff + jitter
  const attemptWithRetry = useCallback(async (fn: () => Promise<any>, maxAttempts = 4) => {
    let attempt = 0;
    let lastErr: any = null;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        attempt += 1;
        const base = Math.pow(2, attempt) * 250; // base ms
        const jitter = Math.floor(Math.random() * 200);
        const delay = base + jitter;
        // Wait before retrying
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastErr;
  }, []);

  // Outbox persisted to localStorage for offline sync
  const OUTBOX_KEY = `drafts-outbox-${key}`;
  const loadOutbox = useCallback(() => {
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      if (!raw) return [] as any[];
      return JSON.parse(raw) as any[];
    } catch (e) {
      return [] as any[];
    }
  }, [OUTBOX_KEY]);
  const saveOutbox = useCallback((outbox: any[]) => {
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    } catch (e) {
      // ignore
    }
  }, [OUTBOX_KEY]);

  const enqueueOutbox = useCallback((action: any) => {
    const outbox = loadOutbox();
    outbox.push({ attempts: 0, ...action });
    saveOutbox(outbox);
  }, [loadOutbox, saveOutbox]);

  const processOutbox = useCallback(async () => {
    const outbox = loadOutbox();
    if (!outbox.length) return;
    let modified = false;
    const remaining: any[] = [];
    for (const item of outbox) {
      try {
        if (item.type === 'upsert') {
          if (!item.id) {
            const created = await attemptWithRetry(() => tenantApi.createDraft({ key, content: item.content, metadata: item.metadata, owner_id: item.ownerId }));
            item.id = (created as any).id;
            setDraftId(item.id);
            const updatedAt = new Date((created as any).updated_at).getTime();
            setLastSyncedAt(updatedAt);
            // Persist snapshot for other hook instances
            try { localStorage.setItem(`drafts-local-${key}`, JSON.stringify({ draftId: item.id, lastSyncedAt: updatedAt })); } catch (e) { /* ignore */ }
          } else {
            const updated = await attemptWithRetry(() => tenantApi.updateDraft(item.id, { content: item.content, metadata: item.metadata }));
            setLastSyncedAt(new Date((updated as any).updated_at).getTime());
          }
        } else if (item.type === 'delete') {
          if (item.id) {
            await attemptWithRetry(() => tenantApi.deleteDraft(item.id));
            // If we just deleted the draft that matches our current draftId, clear local state
            if (draftId === item.id) {
              setDraftId(null);
              setLastSyncedAt(null);
              setStatus('idle');
            }
          }
        }
        modified = true;
        // notify other hook instances that a draft changed
        try {
          window.dispatchEvent(new CustomEvent(`drafts-changed-${key}`));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        item.attempts = (item.attempts || 0) + 1;
        // Keep item if we haven't exhausted attempts
        if ((item.attempts || 0) < 4) {
          remaining.push(item);
        } else {
          // give up and mark error
          setStatus('error');
        }
      }
    }

    if (remaining.length !== outbox.length) {
      saveOutbox(remaining);
    }
  }, [OUTBOX_KEY, key, draftId, loadOutbox, saveOutbox, attemptWithRetry]);

  // Periodically process the outbox and when back online
  useEffect(() => {
    const interval = setInterval(() => {
      void processOutbox();
    }, 5000);
    const onOnline = () => void processOutbox();
    const onChanged = () => {
      // When another instance signals a change, reload local snapshot
      try {
        const raw = localStorage.getItem(`drafts-local-${key}`);
        if (raw) {
          const snap = JSON.parse(raw);
          if (snap?.draftId) setDraftId(snap.draftId);
          if (snap?.lastSyncedAt) setLastSyncedAt(snap.lastSyncedAt);
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener(`drafts-changed-${key}`, onChanged as EventListener);

    // Try immediately
    void processOutbox();
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener(`drafts-changed-${key}`, onChanged as EventListener);
    };
  }, [processOutbox, key]);

  // Debounced save (uses outbox for offline resilience)
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
          // Enqueue for outbox processing
          enqueueOutbox({ type: 'upsert', id: undefined, content, metadata, ownerId });
          // Optimistically set saved status for UI
          setStatus('saved');
        } else {
          // update
          enqueueOutbox({ type: 'upsert', id: draftId, content, metadata, ownerId });
          setStatus('saved');
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
        // Enqueue create
        enqueueOutbox({ type: 'upsert', id: undefined, content: payload, metadata, ownerId });
      } else {
        enqueueOutbox({ type: 'upsert', id: draftId, content: payload, metadata, ownerId });
      }
      // Try to process immediately
      await processOutbox();
      setStatus('saved');
    } catch (e) {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, draftId, key, enqueueOutbox, processOutbox]);

  const deleteDraft = useCallback(async (id?: string) => {
    let toDeleteId = id || draftId;
    if (!toDeleteId) {
      try {
        const raw = localStorage.getItem(`drafts-local-${key}`);
        if (raw) {
          const snap = JSON.parse(raw);
          toDeleteId = snap?.draftId;
        }
      } catch (e) {
        // ignore
      }
    }
    if (!toDeleteId) return;
    try {
      // Enqueue delete action and try to process
      enqueueOutbox({ type: 'delete', id: toDeleteId });
      // Clear local snapshot immediately
      setDraftId(null);
      setLastSyncedAt(null);
      setStatus('idle');
      await processOutbox();
    } catch (e) {
      setStatus('error');
    }
  }, [draftId, enqueueOutbox, processOutbox, key]);

  return {
    content,
    setContent,
    status,
    draftId,
    lastSyncedAt,
    restoreRemote,
    manualSave,
    deleteDraft,
    // Helpers for testing/advanced usage
    _enqueueOutbox: enqueueOutbox,
    _processOutbox: processOutbox,
  } as const;
}

export default useAutosaveDraft;
