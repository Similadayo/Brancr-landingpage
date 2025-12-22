'use client';

import React, { useState } from 'react';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

type ParsedItem = {
  name: string;
  price?: number | null;
  currency?: string | null;
  type?: string | null;
  confidence?: number;
  [key: string]: any;
};

export default function ParsedItemsReview({ items, onSaved }: { items: ParsedItem[]; onSaved?: () => void }) {
  const [localItems, setLocalItems] = useState<ParsedItem[]>(items);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<ParsedItem>) => {
    setLocalItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setLocalItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAsDraft = async () => {
    try {
      setSaving(true);
      const payload = {
        key: 'import.products',
        title: `Imported items - ${new Date().toLocaleString()}`,
        content: { items: localItems },
      };
      await tenantApi.createDraft(payload);
      toast.success('Draft saved');
      onSaved?.();
    } catch (e) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const createProducts = async () => {
    try {
      setSaving(true);
      for (const it of localItems) {
        await tenantApi.createProduct({ name: it.name, price: it.price, currency: it.currency });
      }
      toast.success('Products created');
      onSaved?.();
    } catch (e) {
      toast.error('Failed to create products');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Review parsed items ({localItems.length})</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={saveAsDraft}
            disabled={saving || localItems.length === 0}
            className="rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 border"
          >
            {saving ? 'Saving…' : 'Save as draft'}
          </button>
          <button
            onClick={createProducts}
            disabled={saving || localItems.length === 0}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
          >
            {saving ? 'Creating…' : 'Create products'}
          </button>
        </div>
      </div>

      <ul className="grid gap-3">
        {localItems.map((it, idx) => (
          <li key={idx} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                  />
                  <input
                    value={it.price ?? ''}
                    onChange={(e) => updateItem(idx, { price: e.target.value === '' ? null : Number(e.target.value) })}
                    className="w-28 rounded-md border border-gray-200 px-2 py-1 text-sm"
                    placeholder="Price"
                    type="number"
                  />
                  <input
                    value={it.currency ?? ''}
                    onChange={(e) => updateItem(idx, { currency: e.target.value })}
                    className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
                    placeholder="NGN"
                  />
                </div>
                {it.type && <div className="mt-2 text-xs text-gray-500">Type: {it.type}</div>}
                {it.price == null && (
                  <div className="mt-1 text-xs text-gray-500">Missing price — you can add this later</div>
                )}
                {it.confidence !== undefined && (
                  <div className="mt-1 text-xs text-gray-400">Confidence: {(it.confidence * 100).toFixed(0)}%</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(idx)} className="text-xs text-rose-600">Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
