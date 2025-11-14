'use client';

import { useState, FormEvent, useEffect } from 'react';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'en-NG', label: 'English (Nigeria)' },
  { value: 'fr', label: 'French' },
  { value: 'sw', label: 'Swahili' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pt', label: 'Portuguese' },
];

type PersonaData = {
  bot_name: string;
  tone: string;
  language: string;
  humor?: boolean;
  style_notes?: string;
};

export function PersonaStep({
  onComplete,
  isSubmitting,
  initialData,
}: {
  onComplete: (step: 'persona', data: PersonaData) => void;
  isSubmitting: boolean;
  initialData?: {
    bot_name?: string;
    tone?: string;
    language?: string;
    humor?: boolean;
    style_notes?: string;
  };
}) {
  const [formData, setFormData] = useState<PersonaData>({
    bot_name: initialData?.bot_name || '',
    tone: initialData?.tone || '',
    language: initialData?.language || 'en',
    humor: initialData?.humor ?? false,
    style_notes: initialData?.style_notes || '',
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        bot_name: initialData.bot_name || '',
        tone: initialData.tone || '',
        language: initialData.language || 'en',
        humor: initialData.humor ?? false,
        style_notes: initialData.style_notes || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.bot_name || !formData.tone || !formData.language) {
      return;
    }
    onComplete('persona', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="bot_name" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🤖</span>
          Bot Name <span className="text-red-500">*</span>
        </label>
        <input
          id="bot_name"
          type="text"
          required
          value={formData.bot_name}
          onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
          placeholder="Luna, Alex, or your custom name"
        />
        <p className="mt-2 text-xs text-gray-500">This is how your AI assistant will introduce itself to customers</p>
      </div>

      <div>
        <label htmlFor="tone" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🎭</span>
          Tone <span className="text-red-500">*</span>
        </label>
        <input
          id="tone"
          type="text"
          required
          value={formData.tone}
          onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
          placeholder="friendly, professional, casual, witty"
        />
        <p className="mt-2 text-xs text-gray-500">Describe how your AI should communicate (e.g., &quot;friendly, professional&quot;)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="language" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
            <span className="text-primary">🌍</span>
            Language <span className="text-red-500">*</span>
          </label>
          <select
            id="language"
            required
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgNy41TDEwIDEyLjVMMTUgNy41IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] bg-no-repeat bg-right-4 bg-[length:20px] pr-10"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <div className="mt-8 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 w-full hover:border-primary/50 transition-all duration-200">
            <label htmlFor="humor" className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  id="humor"
                  type="checkbox"
                  checked={formData.humor}
                  onChange={(e) => setFormData({ ...formData, humor: e.target.checked })}
                  className="sr-only"
                />
                <div className={`h-6 w-11 rounded-full transition-all duration-200 ${
                  formData.humor ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300'
                }`}>
                  <div className={`h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-0.5 ${
                    formData.humor ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">Include humor</span>
                <p className="text-xs text-gray-500 mt-0.5">Add a playful touch to responses</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="style_notes" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">✨</span>
          Style Notes <span className="text-xs text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="style_notes"
          rows={4}
          value={formData.style_notes}
          onChange={(e) => setFormData({ ...formData, style_notes: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 resize-none"
          placeholder="Always use emojis, keep responses under 100 words, use formal language, etc."
        />
        <p className="mt-2 text-xs text-gray-500">Customize how your AI communicates with specific guidelines</p>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting || !formData.bot_name || !formData.tone || !formData.language}
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

