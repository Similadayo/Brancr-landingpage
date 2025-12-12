'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCardIcon, CheckCircleIcon } from '../../../components/icons';
import Select from '../../../components/ui/Select';
import { useNegotiationSettings, useUpdateNegotiationSettings } from '../../../hooks/useNegotiationSettings';

export default function NegotiationSettingsPage() {
  const { data: settings, isLoading } = useNegotiationSettings();
  const updateMutation = useUpdateNegotiationSettings();

  const [local, setLocal] = useState({
    negotiation_mode: 'disabled' as 'disabled' | 'range',
    negotiation_min_price: '',
    negotiation_max_price: '',
  });

  useEffect(() => {
    if (!settings) return;
    setLocal({
      negotiation_mode: settings.negotiation_mode,
      negotiation_min_price:
        settings.negotiation_min_price !== undefined ? String(settings.negotiation_min_price) : '',
      negotiation_max_price:
        settings.negotiation_max_price !== undefined ? String(settings.negotiation_max_price) : '',
    });
  }, [settings]);

  const handleSave = async () => {
    if (local.negotiation_mode === 'range') {
      if (local.negotiation_min_price === '' || local.negotiation_max_price === '') {
        toast.error('Set both min and max price for range negotiation.');
        return;
      }
      const min = Number(local.negotiation_min_price);
      const max = Number(local.negotiation_max_price);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        toast.error('Min and max price must be valid numbers.');
        return;
      }
      if (min > max) {
        toast.error('Min price cannot be greater than max price.');
        return;
      }

      await updateMutation.mutateAsync({
        negotiation_mode: 'range',
        negotiation_min_price: min,
        negotiation_max_price: max,
      });
      return;
    }

    await updateMutation.mutateAsync({
      negotiation_mode: 'disabled',
      negotiation_min_price: undefined,
      negotiation_max_price: undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCardIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Negotiation Settings</h1>
            <p className="mt-1 text-sm text-gray-600">Set the default pricing rules the AI follows</p>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700" htmlFor="tenant-negotiation-mode">Default Negotiation</label>
            <div className="mt-1">
              <Select
                id="tenant-negotiation-mode"
                value={local.negotiation_mode}
                onChange={(value) => setLocal((prev) => ({ ...prev, negotiation_mode: value as any }))}
                options={[
                  { value: 'disabled', label: 'No negotiation (fixed price)' },
                  { value: 'range', label: 'Allow negotiation within a range' },
                ]}
                searchable={false}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Items can override this in their own forms.</p>
          </div>

          {local.negotiation_mode === 'range' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700" htmlFor="tenant-negotiation-min">Min Price</label>
                <input
                  id="tenant-negotiation-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={local.negotiation_min_price}
                  onChange={(e) => setLocal((prev) => ({ ...prev, negotiation_min_price: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700" htmlFor="tenant-negotiation-max">Max Price</label>
                <input
                  id="tenant-negotiation-max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={local.negotiation_max_price}
                  onChange={(e) => setLocal((prev) => ({ ...prev, negotiation_max_price: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
