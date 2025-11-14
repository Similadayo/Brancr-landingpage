'use client';

import { useState, FormEvent } from 'react';

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
}: {
  onComplete: (step: 'persona', data: PersonaData) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<PersonaData>({
    bot_name: '',
    tone: '',
    language: 'en',
    humor: false,
    style_notes: '',
  });

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
        <label htmlFor="bot_name" className="block text-sm font-medium text-gray-700 mb-2">
          Bot Name <span className="text-red-500">*</span>
        </label>
        <input
          id="bot_name"
          type="text"
          required
          value={formData.bot_name}
          onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Luna, Alex, or your custom name"
        />
        <p className="mt-1 text-xs text-gray-500">This is how your AI assistant will introduce itself</p>
      </div>

      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
          Tone <span className="text-red-500">*</span>
        </label>
        <input
          id="tone"
          type="text"
          required
          value={formData.tone}
          onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="friendly, professional, casual, witty"
        />
        <p className="mt-1 text-xs text-gray-500">Describe how your AI should communicate (e.g., &quot;friendly, professional&quot;)</p>
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
          Language <span className="text-red-500">*</span>
        </label>
        <select
          id="language"
          required
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="humor"
          type="checkbox"
          checked={formData.humor}
          onChange={(e) => setFormData({ ...formData, humor: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
        />
        <label htmlFor="humor" className="text-sm font-medium text-gray-700">
          Include humor in responses
        </label>
      </div>

      <div>
        <label htmlFor="style_notes" className="block text-sm font-medium text-gray-700 mb-2">
          Style Notes (optional)
        </label>
        <textarea
          id="style_notes"
          rows={3}
          value={formData.style_notes}
          onChange={(e) => setFormData({ ...formData, style_notes: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Always use emojis, keep responses under 100 words, etc."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.bot_name || !formData.tone || !formData.language}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}

