'use client';

import { useState } from 'react';
import { IndustrySelector } from '../IndustrySelector';
import { useSetTenantIndustry } from '../../hooks/useIndustry';
import { toast } from 'react-hot-toast';

type IndustryStepProps = {
  onComplete: (data: { industry_id: number }) => void;
  savedData?: { industry_id?: number };
  isLoading?: boolean;
};

export function IndustryStep({ onComplete, savedData, isLoading }: IndustryStepProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(savedData?.industry_id || null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherIndustryName, setOtherIndustryName] = useState("");
  const setIndustryMutation = useSetTenantIndustry();

  const handleContinue = async () => {
    // If user selected 'Other' and provided a name, save request locally and proceed (backend support required to persist custom industries)
    if (selectedIndustryId === -1) {
      if (!otherIndustryName.trim()) return;
      // For now: record the requested industry in localStorage and inform the team via toast
      try {
        const requests = JSON.parse(localStorage.getItem('requested-industries') || '[]');
        requests.push({ name: otherIndustryName.trim(), timestamp: new Date().toISOString() });
        localStorage.setItem('requested-industries', JSON.stringify(requests));
        toast.success('Thanks — we received your industry suggestion and will review it.');
        onComplete({ industry_id: -1 });
      } catch (e) {
        console.error('Failed to save requested industry', e);
        toast.success('Thanks — we received your suggestion.');
        onComplete({ industry_id: -1 });
      }
      return;
    }

    if (!selectedIndustryId) {
      return;
    }

    try {
      await setIndustryMutation.mutateAsync(selectedIndustryId);
      onComplete({ industry_id: selectedIndustryId });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Select Your Industry</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose the industry that best describes your business. This helps us customize your experience.
        </p>
      </div>

      <IndustrySelector
        onSelect={(industryId) => { setSelectedIndustryId(industryId); setShowOtherInput(false); }}
        showDescription={true}
        allowChange={true}
      />

      <div className="mt-2">
        <button
          type="button"
          onClick={() => { setSelectedIndustryId(-1); setShowOtherInput(true); }}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${selectedIndustryId === -1 ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-700'} transition hover:scale-105`}
        >
          My industry isn&apos;t listed — enter it
        </button>
        {showOtherInput && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-900">Other industry</label>
            <input
              type="text"
              value={otherIndustryName}
              onChange={(e) => setOtherIndustryName(e.target.value)}
              placeholder={'Describe your industry (e.g., "Custom floristry")'}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-xs text-gray-500">We&apos;ll review and add new industries on request; creating custom industries requires backend support.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={(selectedIndustryId === null) || (selectedIndustryId === -1 && !otherIndustryName.trim()) || isLoading || setIndustryMutation.isPending}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || setIndustryMutation.isPending ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

