'use client';

import React, { useState } from 'react';
import { tenantApi, ParsedItem } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function ParsedItemsReview({ items, industry = 'products', onSaved }: { items: ParsedItem[]; industry?: string; onSaved?: () => void }) {
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
        key: `import.${industry}`,
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

  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);

  const createProducts = async () => {
    try {
      setSaving(true);
      for (const it of localItems) {
        // Prepare extended payload
        const commonFields = {
          name: it.name,
          price: it.price ?? 0,
          currency: it.currency ?? 'NGN',
          description: it.description,
          category: it.category
        };

        if (industry === 'products') {
          await tenantApi.createProduct({ ...commonFields });
        } else if (industry === 'menu') {
          await tenantApi.createMenuItem({ ...commonFields, description: it.description ?? '' });
        } else if (industry === 'services') {
          // Services often need more details
          await tenantApi.createService({
            name: it.name,
            description: it.description ?? '',
            pricing: {
              type: 'fixed',
              rate: it.price ?? 0,
              min_price: it.min_price,
              max_price: it.max_price,
              currency: it.currency ?? 'NGN'
            },
            duration: it.duration,
            deliverables: it.deliverables
          });
        } else {
          // Fallback
          await tenantApi.createProduct(commonFields);
        }
      }
      toast.success('Items created');
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create items');
    } finally {
      setSaving(false);
      setConfirmCreateOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Parsed Items</h2>
            <p className="mt-1 text-sm text-gray-600">
              Found <span className="font-semibold text-primary">{localItems.length}</span> item{localItems.length !== 1 ? 's' : ''}. Review and edit before creating.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={saveAsDraft}
              disabled={saving || localItems.length === 0}
              className="rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              onClick={() => setConfirmCreateOpen(true)}
              disabled={saving || localItems.length === 0}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {saving ? 'Creating…' : `Create ${localItems.length} Item${localItems.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {confirmCreateOpen && (
        <ConfirmModal
          open={true}
          title={`Create ${localItems.length} item(s)`}
          description={`Are you sure you want to create ${localItems.length} item(s) in ${industry}? This will add them directly to your catalog.`}
          confirmText="Create"
          onConfirm={() => void createProducts()}
          onCancel={() => setConfirmCreateOpen(false)}
        />
      )}

      {/* Items List */}
      <div className="space-y-4">
        {localItems.map((it, idx) => (
          <div key={idx} className="rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex flex-col gap-4">

              {/* Row 1: Name, Price, Currency, Duration */}
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name</label>
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="Item name"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price</label>
                  <input
                    value={it.price ?? ''}
                    onChange={(e) => updateItem(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="0.00"
                    type="number"
                  />
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Currency</label>
                  <input
                    value={it.currency ?? ''}
                    onChange={(e) => updateItem(idx, { currency: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="NGN"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Duration</label>
                  <input
                    value={it.duration ?? ''}
                    onChange={(e) => updateItem(idx, { duration: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="e.g. 1 month"
                  />
                </div>
              </div>

              {/* Row 2: Negotiation Rules (Min/Max) */}
              <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Min Price (Negotiation Floor)</label>
                  <input
                    value={it.min_price ?? ''}
                    onChange={(e) => updateItem(idx, { min_price: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="Optional"
                    type="number"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Max Price (Negotiation Ceiling)</label>
                  <input
                    value={it.max_price ?? ''}
                    onChange={(e) => updateItem(idx, { max_price: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="Optional"
                    type="number"
                  />
                </div>
              </div>

              {/* Row 3: Description & Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    value={it.description ?? ''}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    rows={3}
                    placeholder="Item description..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Deliverables (One per line)</label>
                  <textarea
                    value={it.deliverables?.join('\n') ?? ''}
                    onChange={(e) => updateItem(idx, { deliverables: e.target.value.split('\n') })}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    rows={3}
                    placeholder="• Deliverable 1&#10;• Deliverable 2"
                  />
                </div>
              </div>

              {/* Actions & Metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2">
                  {it.type && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{it.type}</span>}
                  {it.category && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{it.category}</span>}
                  <span className="text-xs text-gray-400">Confidence: {(it.confidence * 100).toFixed()}%</span>
                </div>

                <button
                  onClick={() => removeItem(idx)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
