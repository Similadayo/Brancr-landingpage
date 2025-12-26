'use client';

import React, { useState } from 'react';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

type ParsedItem = {
  name: string;
  price?: number | null;
  currency?: string | null;
  type?: string | null;
  confidence?: number;
  [key: string]: any;
};

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
        if (industry === 'products') {
          await tenantApi.createProduct({ name: it.name, price: it.price ?? 0, currency: it.currency ?? 'NGN' });
        } else if (industry === 'menu') {
          await tenantApi.createMenuItem({ name: it.name, price: it.price ?? 0, currency: it.currency ?? 'NGN', description: it.description });
        } else if (industry === 'services') {
          await tenantApi.createService({ name: it.name, description: it.description, pricing: { type: 'fixed', rate: it.price ?? 0 } });
        } else {
          // fallback to product
          await tenantApi.createProduct({ name: it.name, price: it.price ?? 0, currency: it.currency ?? 'NGN' });
        }
      }
      toast.success('Items created');
      onSaved?.();
    } catch (e) {
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
      <div className="space-y-3">
        {localItems.map((it, idx) => (
          <div key={idx} className="rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name</label>
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="Item name"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price</label>
                    <input
                      value={it.price ?? ''}
                      onChange={(e) => updateItem(idx, { price: e.target.value === '' ? null : Number(e.target.value) })}
                      className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Currency</label>
                    <input
                      value={it.currency ?? ''}
                      onChange={(e) => updateItem(idx, { currency: e.target.value })}
                      className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="NGN"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {it.type && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Type: {it.type}
                    </span>
                  )}
                  {it.price == null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Missing price
                    </span>
                  )}
                  {it.confidence !== undefined && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {(it.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => removeItem(idx)} 
                className="flex-shrink-0 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
