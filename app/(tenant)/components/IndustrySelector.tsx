'use client';

import { useState, useEffect } from "react";
import { useIndustries, useTenantIndustry, useSetTenantIndustry } from "../hooks/useIndustry";
import { PlusIcon, CheckCircleIcon } from "./icons";
import { toast } from "react-hot-toast";

type IndustrySelectorProps = {
  onSelect?: (industryId: string) => void;
  showDescription?: boolean;
  allowChange?: boolean;
};

export function IndustrySelector({ onSelect, showDescription = true, allowChange = true }: IndustrySelectorProps) {
  const { data: industries = [], isLoading: industriesLoading, error: industriesError } = useIndustries();
  const { data: currentIndustry, isLoading: currentLoading } = useTenantIndustry();
  const setIndustryMutation = useSetTenantIndustry();
  const [selectedId, setSelectedId] = useState<string | null>(currentIndustry?.industry_id || null);

  // Debug logging
  useEffect(() => {
    console.log('[IndustrySelector] State:', {
      industriesCount: industries.length,
      isLoading: industriesLoading,
      hasError: !!industriesError,
      currentIndustry: currentIndustry?.industry_name,
      selectedId,
    });
  }, [industries, industriesLoading, industriesError, currentIndustry, selectedId]);

  const handleSelect = async (industryId: string) => {
    // Always allow changing industry - no restrictions
    setSelectedId(industryId);

    try {
      await setIndustryMutation.mutateAsync(industryId);
      onSelect?.(industryId);
    } catch (error) {
      // Revert selection on error
      setSelectedId(currentIndustry?.industry_id || null);
      // Error is already handled by the mutation's onError callback
      console.error("Industry selection failed:", error);
    }
  };

  if (industriesLoading || currentLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (industriesError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-red-100 p-3">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load industries</h3>
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
          Unable to load the list of industries. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (industries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-gray-600">No industries available.</p>
      </div>
    );
  }

  const selectedIndustry = industries.find((ind) => ind.id === selectedId || ind.id === currentIndustry?.industry_id);

  return (
    <div className="space-y-6">
      {currentIndustry && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Industry</p>
              <p className="text-sm text-gray-600">{currentIndustry.industry_name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => {
          const isSelected = selectedId === industry.id || currentIndustry?.industry_id === industry.id;
          const isCurrent = currentIndustry?.industry_id === industry.id;

          return (
            <button
              key={industry.id}
              type="button"
              onClick={() => handleSelect(industry.id)}
              disabled={false}
              className={`relative rounded-xl border-2 p-6 text-left transition-all ${isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm"
                } cursor-pointer`}
            >
              {isCurrent && (
                <div className="absolute right-3 top-3">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{industry.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{industry.category}</p>
              </div>

              {showDescription && (
                <p className="mb-4 text-sm text-gray-600 line-clamp-2">{industry.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {industry.has_products && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Products
                  </span>
                )}
                {industry.has_menu && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Menu
                  </span>
                )}
                {industry.has_services && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    Services
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {setIndustryMutation.isPending && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/20 border-t-blue-600" />
          Updating industry...
        </div>
      )}
    </div>
  );
}

