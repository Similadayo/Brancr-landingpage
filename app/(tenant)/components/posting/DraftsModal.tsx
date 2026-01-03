'use client';

import React, { useEffect, useState } from 'react';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

type Draft = {
  id: string;
  key: string;
  content: any;
  metadata?: any;
  owner_id?: number;
  created_at: string;
  updated_at: string;
};

export default function DraftsModal({
  open,
  onClose,
  onRestore,
  onDiscard,
  autoRestoreSingle = true,
  keyName = 'compose.post',
}: {
  open: boolean;
  onClose: () => void;
  onRestore: (draft: Draft) => Promise<void> | void;
  onDiscard?: (id: string) => Promise<void> | void;
  autoRestoreSingle?: boolean;
  keyName?: string;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<{ open: boolean; id?: string }>({ open: false });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res: any = await tenantApi.getDrafts(keyName);
        const serverList: Draft[] = (res?.drafts || []).slice();

        // Try to include a local snapshot (key-based) as a local-only draft when present
        try {
          const raw = localStorage.getItem(`drafts-local-content-${keyName}`);
          if (raw) {
            const snap = JSON.parse(raw);
            if (snap && snap.content) {
              const updatedAt = snap.updated_at || snap.updatedAt || new Date().toISOString();
              const localId = snap.draftId || `local-${updatedAt}`;
              const already = serverList.find((d) => d.id === localId);
              if (!already) {
                serverList.push({
                  id: localId,
                  key: keyName,
                  content: snap.content,
                  metadata: snap.metadata,
                  owner_id: undefined,
                  created_at: updatedAt,
                  updated_at: updatedAt,
                  // @ts-ignore temporary flag for UI
                  _local_only: true,
                  // @ts-ignore store snapshot for restore
                  _local_snapshot: snap,
                });
              }
            }
          }
        } catch (e) {
          // ignore
        }

        const list: Draft[] = serverList.slice().sort((a: Draft, b: Draft) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        if (!mounted) return;
        setDrafts(list);

        if (list.length === 1 && autoRestoreSingle) {
          const d = list[0];
          // Auto-restore the single draft (works for both server and local-only synthetic drafts)
          await Promise.resolve(onRestore(d));
          const savedAgo = Math.max(0, Date.now() - new Date(d.updated_at).getTime());
          const mins = Math.floor(savedAgo / 60000);
          const text = mins < 1 ? 'less than a minute ago' : `${mins} minute${mins > 1 ? 's' : ''} ago`;
          toast.success(
            // eslint-disable-next-line react/jsx-no-bind
            (t) => (
              <div className="flex items-center gap-3">
                <div>Restored draft — saved {text}</div>
                <button
                  className="ml-4 rounded-md bg-white px-2 py-1 text-xs font-semibold text-rose-600 border border-rose-200"
                  onClick={async () => {
                    try {
                      setDeletingId(d.id);
                      if ((d as any)._local_only) {
                        try { localStorage.removeItem(`drafts-local-content-${keyName}`); } catch (e) { /* ignore */ }
                        setDeletingId(null);
                        try { await Promise.resolve(onDiscard?.(d.id)); } catch (e) { /* ignore */ }
                        toast.dismiss(t.id);
                        toast.success('Draft discarded');
                        return;
                      }

                      await tenantApi.deleteDraft(d.id);
                      setDeletingId(null);
                      try { await Promise.resolve(onDiscard?.(d.id)); } catch (e) { /* ignore */ }
                      toast.dismiss(t.id);
                      toast.success('Draft discarded');
                    } catch (e) {
                      toast.error('Failed to discard draft');
                    }
                  }}
                >
                  Discard
                </button>
              </div>
            ),
            { duration: 8000 }
          );
          onClose();
          return;
        }
      } catch (e) {
        console.error('Failed to load drafts:', e);
        toast.error('Failed to load drafts');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, keyName, onRestore, autoRestoreSingle, onClose, onDiscard]);

  // focus + escape handling for accessibility
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // focus the title so screen readers land in the dialog
    try {
      const el = document.getElementById('drafts-title') as HTMLElement | null;
      if (el) el.focus();
    } catch (err) { /* ignore */ }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDiscard = async (id: string) => {
    setConfirmDiscard({ open: false });
    setDeletingId(id);
    try {
      // If local-only synthetic draft, remove local snapshot
      const found = drafts.find((d) => d.id === id);
      if ((found as any)?._local_only) {
        try { localStorage.removeItem(`drafts-local-content-${keyName}`); } catch (e) { /* ignore */ }
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        try { await Promise.resolve(onDiscard?.(id)); } catch (e) { /* ignore */ }
        toast.success('Draft removed');
        setDeletingId(null);
        return;
      }

      await tenantApi.deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      try { await Promise.resolve(onDiscard?.(id)); } catch (e) { /* ignore */ }
      toast.success('Draft discarded');
    } catch (e) {
      toast.error('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="drafts-title" className="z-50 w-full max-w-2xl rounded-xl bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 id="drafts-title" tabIndex={-1} className="text-lg font-semibold">Drafts</h2>
          <button onClick={onClose} aria-label="Close" className="text-sm text-gray-500">Close</button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading drafts…</div>
          ) : drafts.length === 0 ? (
            <div className="text-sm text-gray-500">No drafts found.</div>
          ) : (
            <ul className="space-y-3">
              {drafts.map((d) => (
                <li
                  key={d.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Restore draft saved ${new Date(d.updated_at).toLocaleString()}`}
                  onClick={async () => {
                    await Promise.resolve(onRestore(d));
                    toast.success('Draft restored');
                    onClose();
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      await Promise.resolve(onRestore(d));
                      toast.success('Draft restored');
                      onClose();
                    }
                  }}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">Saved {new Date(d.updated_at).toLocaleString()}</div>
                      {(d as any)._local_only && (
                        <div className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-100">Saved locally</div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {d.content && d.content.caption ? d.content.caption.split('\n')[0].slice(0, 200) : '(no caption)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await Promise.resolve(onRestore(d));
                        toast.success('Draft restored');
                        onClose();
                      }}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                    >
                      Restore
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDiscard({ open: true, id: d.id }); }}
                      disabled={deletingId === d.id}
                      className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      {deletingId === d.id ? 'Discarding…' : 'Discard'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {confirmDiscard.open && (
          <ConfirmModal
            open={true}
            title="Discard draft"
            description="Are you sure you want to discard this draft? This cannot be undone."
            confirmText="Discard"
            onConfirm={() => confirmDiscard.id && void handleDiscard(confirmDiscard.id)}
            onCancel={() => setConfirmDiscard({ open: false })}
          />
        )}
      </div>
    </div>
  );
}
