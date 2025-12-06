'use client';

import { useState } from "react";
import { PlusIcon, XIcon, TrashIcon } from "../icons";

type VariantBuilderProps = {
  variants: Record<string, string[]>;
  onChange: (variants: Record<string, string[]>) => void;
};

export default function VariantBuilder({ variants, onChange }: VariantBuilderProps) {
  const [variantTypes, setVariantTypes] = useState<string[]>(Object.keys(variants));

  const addVariantType = () => {
    const newType = `variant_${Date.now()}`;
    setVariantTypes([...variantTypes, newType]);
    onChange({ ...variants, [newType]: [] });
  };

  const removeVariantType = (type: string) => {
    const newTypes = variantTypes.filter((t) => t !== type);
    const newVariants = { ...variants };
    delete newVariants[type];
    setVariantTypes(newTypes);
    onChange(newVariants);
  };

  const updateVariantTypeName = (oldName: string, newName: string) => {
    if (newName === oldName || !newName.trim()) return;
    
    const newTypes = variantTypes.map((t) => (t === oldName ? newName : t));
    const newVariants: Record<string, string[]> = {};
    
    Object.keys(variants).forEach((key) => {
      if (key === oldName) {
        newVariants[newName] = variants[key];
      } else {
        newVariants[key] = variants[key];
      }
    });
    
    setVariantTypes(newTypes);
    onChange(newVariants);
  };

  const addVariantValue = (type: string, value: string) => {
    if (!value.trim()) return;
    const currentValues = variants[type] || [];
    if (currentValues.includes(value.trim())) {
      return; // Don't add duplicates
    }
    onChange({ ...variants, [type]: [...currentValues, value.trim()] });
  };

  const removeVariantValue = (type: string, value: string) => {
    const currentValues = variants[type] || [];
    onChange({ ...variants, [type]: currentValues.filter((v) => v !== value) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">Product Variants</label>
        <button
          type="button"
          onClick={addVariantType}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Variant Type
        </button>
      </div>

      {variantTypes.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No variants. Click &quot;Add Variant Type&quot; to create size, color, etc.</p>
      ) : (
        <div className="space-y-3">
          {variantTypes.map((type) => (
            <div key={type} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  value={type}
                  onChange={(e) => updateVariantTypeName(type, e.target.value)}
                  placeholder="e.g., Size, Color"
                  className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => removeVariantType(type)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition"
                  title="Remove variant type"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(variants[type] || []).map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => removeVariantValue(type, value)}
                        className="text-primary hover:text-red-600 transition"
                        aria-label={`Remove ${type} value ${value}`}
                        title={`Remove ${type} value ${value}`}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Add ${type} value...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        addVariantValue(type, input.value);
                        input.value = '';
                      }
                    }}
                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        addVariantValue(type, input.value);
                        input.value = '';
                      }
                    }}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Variants allow customers to choose options like size, color, etc. Example: Size: S, M, L | Color: Red, Blue
      </p>
    </div>
  );
}
