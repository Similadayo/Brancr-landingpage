'use client';

import React, { useState } from 'react';
import { useMedia, type MediaAsset } from '@/app/(tenant)/hooks/useMedia';
import { XIcon } from '../icons';

export default function MediaLibraryModal({ open, onClose, onSelect, maxSelect = 10 }: { open: boolean; onClose: () => void; onSelect: (urls: string[]) => void; maxSelect?: number }) {
  const { data: items = [] } = useMedia({ type: 'image', limit: 50 });
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  const finalize = () => {
    const chosen = items
      .filter((it) => selected[String(it.id)])
      .slice(0, maxSelect)
      .map((it) => it.url || (it.urls && it.urls[0]) || '');
    onSelect(chosen);
    onClose();
    setSelected({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="z-50 w-full max-w-4xl rounded-xl bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Media library</h3>
          <button onClick={onClose} className="text-gray-500"><XIcon className="w-4 h-4"/></button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
          {items.map((it: MediaAsset) => (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className={`relative rounded-lg overflow-hidden border ${selected[String(it.id)] ? 'border-primary' : 'border-gray-200'} bg-gray-100`}
              style={{ aspectRatio: '1 / 1' }}
            >
              <img src={it.url || (it.urls && it.urls[0])} alt={it.name} className="w-full h-full object-cover" />
              {selected[String(it.id)] && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center text-white font-semibold">✓</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">Cancel</button>
          <button onClick={finalize} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Add selected</button>
        </div>
      </div>
    </div>
  );
}
