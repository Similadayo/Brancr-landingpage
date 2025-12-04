'use client';

import { useState } from 'react';
import { IndustrySelector } from '../IndustrySelector';
import { useSetTenantIndustry } from '../../hooks/useIndustry';

type IndustryStepProps = {
  onComplete: (data: { industry_id: number }) => void;
  savedData?: { industry_id?: number };
  isLoading?: boolean;
};

export function IndustryStep({ onComplete, savedData, isLoading }: IndustryStepProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(savedData?.industry_id || null);
  const setIndustryMutation = useSetTenantIndustry();

  const handleContinue = async () => {
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
        onSelect={(industryId) => setSelectedIndustryId(industryId)}
        showDescription={true}
        allowChange={true}
      />

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedIndustryId || isLoading || setIndustryMutation.isPending}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || setIndustryMutation.isPending ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

