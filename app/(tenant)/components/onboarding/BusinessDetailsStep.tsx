'use client';

import { useState, FormEvent } from 'react';

type MenuItem = {
  name: string;
  category: string;
  price: string;
  description: string;
};

type FAQ = {
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
}: {
  onComplete: (step: 'business_details', data: BusinessDetailsData) => void;
  isSubmitting: boolean;
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [keywords, setKeywords] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', category: '', price: '', description: '' }]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
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
      data.menu_items = menuItems.filter((item) => item.name && item.category);
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          💡 This step is optional. You can skip it and add these details later in settings.
        </p>
      </div>

      {/* Menu Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Menu Items (optional)</label>
          <button
            type="button"
            onClick={addMenuItem}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            + Add Item
          </button>
        </div>
        {menuItems.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No menu items added</p>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={item.category}
                    onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeMenuItem(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">FAQs (optional)</label>
          <button
            type="button"
            onClick={addFAQ}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            + Add FAQ
          </button>
        </div>
        {faqs.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No FAQs added</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-3">
                  <textarea
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeFAQ(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
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
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
          Keywords (optional)
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="pizza, italian, food, delivery"
        />
        <p className="mt-1 text-xs text-gray-500">Comma-separated keywords relevant to your business</p>
      </div>

      {/* Knowledge Base */}
      <div>
        <label htmlFor="knowledge_base" className="block text-sm font-medium text-gray-700 mb-2">
          Knowledge Base (optional)
        </label>
        <textarea
          id="knowledge_base"
          rows={5}
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Additional information about your business that the AI should know..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => onComplete('business_details', {})}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
        >
          Skip for now
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}

