'use client';

import { useState } from "react";
import { useIndustries, useTenantIndustry, useSetTenantIndustry } from "../hooks/useIndustry";
import { PlusIcon, CheckCircleIcon } from "./icons";
import { toast } from "react-hot-toast";

type IndustrySelectorProps = {
  onSelect?: (industryId: number) => void;
  showDescription?: boolean;
  allowChange?: boolean;
};

export function IndustrySelector({ onSelect, showDescription = true, allowChange = true }: IndustrySelectorProps) {
  const { data: industries = [], isLoading: industriesLoading } = useIndustries();
  const { data: currentIndustry, isLoading: currentLoading } = useTenantIndustry();
  const setIndustryMutation = useSetTenantIndustry();
  const [selectedId, setSelectedId] = useState<number | null>(currentIndustry?.industry_id || null);

  const handleSelect = async (industryId: number) => {
    if (!allowChange && currentIndustry?.industry_id) {
      toast.error("Industry cannot be changed after initial selection");
      return;
    }

    setSelectedId(industryId);
    
    try {
      await setIndustryMutation.mutateAsync(industryId);
      onSelect?.(industryId);
    } catch (error) {
      setSelectedId(currentIndustry?.industry_id || null);
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

  const selectedIndustry = industries.find((ind) => ind.id === selectedId || ind.id === currentIndustry?.industry_id);

  return (
    <div className="space-y-6">
      {currentIndustry && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Current Industry</p>
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
              disabled={!allowChange && !isCurrent}
              className={`relative rounded-xl border-2 p-6 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm"
              } ${!allowChange && !isCurrent ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isCurrent && (
                <div className="absolute right-3 top-3">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{industry.name}</h3>
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

