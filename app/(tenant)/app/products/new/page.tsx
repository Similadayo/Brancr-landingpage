'use client';

import { useState } from 'react';
import ProductForm from "../../../components/products/ProductForm";
import QuickAddSimple from "../../../components/quick-add/QuickAddSimple";

type TabMode = 'manual' | 'quick';

export default function NewProductPage() {
  const [mode, setMode] = useState<TabMode>('manual');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs Header */}
      <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${mode === 'manual'
              ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode('quick')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${mode === 'quick'
              ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Add
        </button>
      </div>

      {/* Content */}
      {mode === 'manual' ? (
        <ProductForm />
      ) : (
        <QuickAddSimple initialIndustry="products" />
      )}
    </div>
  );
}
