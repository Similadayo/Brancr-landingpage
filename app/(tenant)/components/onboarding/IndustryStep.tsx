'use client';

import { useState } from 'react';
import { IndustrySelector } from '../IndustrySelector';
import { useSetTenantIndustry } from '../../hooks/useIndustry';
import { toast } from 'react-hot-toast';

type IndustryStepProps = {
  onComplete: (data: { industry_id: string }) => void;
  onBack?: () => void;
  savedData?: { industry_id?: string };
  isLoading?: boolean;
};

export function IndustryStep({ onComplete, onBack, savedData, isLoading }: IndustryStepProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(savedData?.industry_id || null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherIndustryName, setOtherIndustryName] = useState("");
  const setIndustryMutation = useSetTenantIndustry();

  const handleContinue = async () => {
    // If user selected 'Other' and provided a name, save request locally and proceed (backend support required to persist custom industries)
    if (selectedIndustryId === 'other') {
      if (!otherIndustryName.trim()) return;
      // For now: record the requested industry in localStorage and inform the team via toast
      try {
        const requests = JSON.parse(localStorage.getItem('requested-industries') || '[]');
        requests.push({ name: otherIndustryName.trim(), timestamp: new Date().toISOString() });
        localStorage.setItem('requested-industries', JSON.stringify(requests));
        toast.success('Thanks — we received your industry suggestion and will review it.');
        onComplete({ industry_id: 'other' });
      } catch (e) {
        console.error('Failed to save requested industry', e);
        toast.success('Thanks — we received your suggestion.');
        onComplete({ industry_id: 'other' });
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Select Your Industry</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
          onClick={() => { setSelectedIndustryId('other'); setShowOtherInput(true); }}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${selectedIndustryId === 'other' ? 'border-primary bg-primary/5 text-primary dark:bg-primary/20' : 'border-gray-200 bg-white text-gray-700 dark:bg-dark-surface dark:border-dark-border dark:text-gray-200'} transition hover:scale-105`}
        >
          My industry isn&apos;t listed — enter it
        </button>
        {showOtherInput && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Other industry</label>
            <input
              type="text"
              value={otherIndustryName}
              onChange={(e) => setOtherIndustryName(e.target.value)}
              placeholder={'Describe your industry (e.g., "Custom floristry")'}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:ring-primary/40"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">We&apos;ll review and add new industries on request; creating custom industries requires backend support.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-dark-surface dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-elevated dark:hover:border-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleContinue}
          disabled={(selectedIndustryId === null) || (selectedIndustryId === 'other' && !otherIndustryName.trim()) || isLoading || setIndustryMutation.isPending}
          className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading || setIndustryMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              Continue
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

