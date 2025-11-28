'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';

// Currency mapping for different countries
const CURRENCY_MAP: Record<string, { symbol: string; code: string; name: string }> = {
  // African countries
  'Nigeria': { symbol: '₦', code: 'NGN', name: 'Naira' },
  'Ghana': { symbol: '₵', code: 'GHS', name: 'Cedi' },
  'Kenya': { symbol: 'KSh', code: 'KES', name: 'Shilling' },
  'South Africa': { symbol: 'R', code: 'ZAR', name: 'Rand' },
  'Egypt': { symbol: 'E£', code: 'EGP', name: 'Pound' },
  'Tanzania': { symbol: 'TSh', code: 'TZS', name: 'Shilling' },
  'Uganda': { symbol: 'USh', code: 'UGX', name: 'Shilling' },
  'Ethiopia': { symbol: 'Br', code: 'ETB', name: 'Birr' },
  'Morocco': { symbol: 'د.م.', code: 'MAD', name: 'Dirham' },
  'Algeria': { symbol: 'د.ج', code: 'DZD', name: 'Dinar' },
  // Other common currencies
  'United States': { symbol: '$', code: 'USD', name: 'Dollar' },
  'United Kingdom': { symbol: '£', code: 'GBP', name: 'Pound' },
  'Eurozone': { symbol: '€', code: 'EUR', name: 'Euro' },
};

// Default currency options (most common)
const COMMON_CURRENCIES = [
  { symbol: '₦', code: 'NGN', name: 'Naira (NGN)', country: 'Nigeria' },
  { symbol: '₵', code: 'GHS', name: 'Cedi (GHS)', country: 'Ghana' },
  { symbol: 'KSh', code: 'KES', name: 'Shilling (KES)', country: 'Kenya' },
  { symbol: 'R', code: 'ZAR', name: 'Rand (ZAR)', country: 'South Africa' },
  { symbol: '$', code: 'USD', name: 'Dollar (USD)', country: 'United States' },
  { symbol: '£', code: 'GBP', name: 'Pound (GBP)', country: 'United Kingdom' },
  { symbol: '€', code: 'EUR', name: 'Euro (EUR)', country: 'Eurozone' },
  { symbol: 'E£', code: 'EGP', name: 'Pound (EGP)', country: 'Egypt' },
  { symbol: 'TSh', code: 'TZS', name: 'Shilling (TZS)', country: 'Tanzania' },
  { symbol: 'USh', code: 'UGX', name: 'Shilling (UGX)', country: 'Uganda' },
];

type MenuItem = {
  id?: number; // Include ID if updating existing, omit for new
  name: string;
  category: string;
  price: string;
  description: string;
};

type FAQ = {
  id?: number; // Include ID if updating existing, omit for new
  question: string;
  answer: string;
};

type BusinessDetailsData = {
  menu_items?: MenuItem[];
  faqs?: FAQ[];
  keywords?: string;
  knowledge_base?: string;
};

export function BusinessDetailsStep({
  onComplete,
  isSubmitting,
  initialData,
}: {
  onComplete: (step: 'business_details', data: BusinessDetailsData) => void;
  isSubmitting: boolean;
  initialData?: {
    menu_items?: MenuItem[];
    faqs?: FAQ[];
    keywords?: string;
    knowledge_base?: string;
  };
}) {
  // Get business profile to detect currency from location
  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  // Detect currency from location
  const detectCurrency = (location?: string): string => {
    if (!location) return 'NGN'; // Default to Naira
    
    const locationLower = location.toLowerCase();
    for (const [country, currency] of Object.entries(CURRENCY_MAP)) {
      if (locationLower.includes(country.toLowerCase())) {
        return currency.code;
      }
    }
    return 'NGN'; // Default
  };

  // Initialize currency based on business location
  const businessLocation = onboardingStatus?.business_profile?.location;
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NGN');

  // Update currency when location is available
  useEffect(() => {
    if (businessLocation) {
      const detected = detectCurrency(businessLocation);
      setSelectedCurrency(detected);
    }
  }, [businessLocation]);

  const selectedCurrencyInfo = COMMON_CURRENCIES.find(c => c.code === selectedCurrency) || COMMON_CURRENCIES[0];

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialData?.menu_items || []);
  const [faqs, setFaqs] = useState<FAQ[]>(initialData?.faqs || []);
  const [keywords, setKeywords] = useState(initialData?.keywords || '');
  const [knowledgeBase, setKnowledgeBase] = useState(initialData?.knowledge_base || '');

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setMenuItems(initialData.menu_items || []);
      setFaqs(initialData.faqs || []);
      setKeywords(initialData.keywords || '');
      setKnowledgeBase(initialData.knowledge_base || '');
    }
  }, [initialData]);

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', category: '', price: '', description: '' }]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...menuItems];
    // Remove currency symbol if user types it
    if (field === 'price') {
      const cleanedValue = value.replace(/[₦₵$£€RKEUShTShBrد.م.د.ج]/g, '').trim();
      updated[index] = { ...updated[index], [field]: cleanedValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setMenuItems(updated);
  };

  const formatPrice = (price: string): string => {
    if (!price) return '';
    // Remove any existing currency symbols
    const cleaned = price.replace(/[₦₵$£€RKEUShTShBrد.م.د.ج]/g, '').trim();
    return cleaned ? `${selectedCurrencyInfo.symbol}${cleaned}` : '';
  };

  const getPriceValue = (price: string): string => {
    // Extract numeric value from price string
    return price.replace(/[₦₵$£€RKEUShTShBrد.م.د.ج]/g, '').trim();
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: BusinessDetailsData = {};
    if (menuItems.length > 0) {
      // Ensure prices are stored as numeric values (without currency symbols)
      data.menu_items = menuItems
        .filter((item) => item.name && item.category)
        .map((item) => ({
          ...item,
          price: getPriceValue(item.price), // Store numeric value only
        }));
    }
    if (faqs.length > 0) {
      data.faqs = faqs.filter((faq) => faq.question && faq.answer);
    }
    if (keywords.trim()) {
      data.keywords = keywords.trim();
    }
    if (knowledgeBase.trim()) {
      data.knowledge_base = knowledgeBase.trim();
    }
    onComplete('business_details', data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-amber-100/50 to-transparent p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              This step is optional
            </p>
            <p className="mt-1 text-xs text-amber-700">
              You can skip it and add these details later in settings.
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="text-primary">🍽️</span>
            Menu Items <span className="text-xs text-gray-500 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Select currency"
            >
              {COMMON_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addMenuItem}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-md"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
        {menuItems.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
            <p className="text-sm text-gray-500">No menu items added yet</p>
            <p className="mt-1 text-xs text-gray-400">Click &quot;Add Item&quot; to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div key={index} className="rounded-xl border-2 border-gray-200 bg-white p-4 space-y-3 shadow-sm hover:border-primary/50 transition-all duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                    className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={item.category}
                    onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                    className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
                      {selectedCurrencyInfo.symbol}
                    </span>
                    <input
                      type="text"
                      placeholder="Price"
                      value={getPriceValue(item.price)}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                        updateMenuItem(index, 'price', numericValue);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value) {
                          updateMenuItem(index, 'price', value);
                        }
                      }}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white pl-8 pr-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMenuItem(index)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 hover:border-red-300"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
                <textarea
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="text-primary">❓</span>
            FAQs <span className="text-xs text-gray-500 font-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={addFAQ}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-md"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add FAQ
          </button>
        </div>
        {faqs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
            <p className="text-sm text-gray-500">No FAQs added yet</p>
            <p className="mt-1 text-xs text-gray-400">Click &quot;Add FAQ&quot; to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border-2 border-gray-200 bg-white p-4 space-y-3 shadow-sm hover:border-primary/50 transition-all duration-200">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
                />
                <div className="flex gap-3">
                  <textarea
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    rows={2}
                    className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeFAQ(index)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 hover:border-red-300"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keywords */}
      <div>
        <label htmlFor="keywords" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🏷️</span>
          Keywords <span className="text-xs text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
          placeholder="pizza, italian, food, delivery"
        />
        <p className="mt-2 text-xs text-gray-500">Comma-separated keywords relevant to your business</p>
      </div>

      {/* Knowledge Base */}
      <div>
        <label htmlFor="knowledge_base" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">📚</span>
          Knowledge Base <span className="text-xs text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="knowledge_base"
          rows={5}
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 resize-none"
          placeholder="Additional information about your business that the AI should know..."
        />
        <p className="mt-2 text-xs text-gray-500">Provide context to help your AI assistant understand your business better</p>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onComplete('business_details', {})}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
        >
          Skip for now
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? (
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
    </form>
  );
}
