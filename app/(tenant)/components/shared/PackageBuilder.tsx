'use client';

import { useState } from "react";
import { PlusIcon, XIcon, TrashIcon } from "../icons";

type Package = {
  name: string;
  price: string;
  duration: string;
  description?: string;
  features?: string[];
};

type PackageBuilderProps = {
  packages: Package[];
  onChange: (packages: Package[]) => void;
};

export default function PackageBuilder({ packages, onChange }: PackageBuilderProps) {
  const addPackage = () => {
    onChange([
      ...packages,
      {
        name: '',
        price: '',
        duration: '',
        description: '',
        features: [],
      },
    ]);
  };

  const removePackage = (index: number) => {
    onChange(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: keyof Package, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addFeature = (packageIndex: number, feature: string) => {
    if (!feature.trim()) return;
    const pkg = packages[packageIndex];
    const features = pkg.features || [];
    if (features.includes(feature.trim())) return;
    
    updatePackage(packageIndex, 'features', [...features, feature.trim()]);
  };

  const removeFeature = (packageIndex: number, feature: string) => {
    const pkg = packages[packageIndex];
    const features = pkg.features || [];
    updatePackage(packageIndex, 'features', features.filter((f) => f !== feature));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">Service Packages</label>
        <button
          type="button"
          onClick={addPackage}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Package
        </button>
      </div>

      {packages.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No packages. Click &quot;Add Package&quot; to create pricing tiers.</p>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Package {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition"
                  title="Remove package"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, 'name', e.target.value)}
                      placeholder="Basic, Premium, Enterprise"
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor={`package-price-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Price (NGN) *</label>
                    <input
                      id={`package-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={pkg.price}
                      onChange={(e) => updatePackage(index, 'price', e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={pkg.duration}
                    onChange={(e) => updatePackage(index, 'duration', e.target.value)}
                    placeholder="1 month, 3-6 months, 1 year"
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={pkg.description || ''}
                    onChange={(e) => updatePackage(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="What's included in this package..."
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Features</label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {(pkg.features || []).map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(index, feature)}
                          className="text-primary hover:text-red-600 transition"
                          aria-label={`Remove feature ${feature}`}
                          title={`Remove feature ${feature}`}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add feature..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          addFeature(index, input.value);
                          input.value = '';
                        }
                      }}
                      className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input) {
                          addFeature(index, input.value);
                          input.value = '';
                        }
                      }}
                      className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Create multiple pricing packages for your service. Example: Basic Package (₦30,000), Premium Package (₦80,000)
      </p>
    </div>
  );
}
