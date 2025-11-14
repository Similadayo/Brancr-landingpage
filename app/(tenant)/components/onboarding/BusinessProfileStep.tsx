'use client';

import { useState, FormEvent } from 'react';

const INDUSTRIES = [
  'restaurant',
  'retail',
  'services',
  'healthcare',
  'education',
  'real_estate',
  'beauty',
  'fitness',
  'technology',
  'other',
];

type BusinessProfileData = {
  name: string;
  industry: string;
  description: string;
  location: string;
  website?: string;
  operating_hours?: string;
};

export function BusinessProfileStep({
  onComplete,
  isSubmitting,
}: {
  onComplete: (step: 'business_profile', data: BusinessProfileData) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<BusinessProfileData>({
    name: '',
    industry: '',
    description: '',
    location: '',
    website: '',
    operating_hours: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.industry || !formData.description || !formData.location) {
      return;
    }
    onComplete('business_profile', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="My Awesome Business"
        />
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          id="industry"
          required
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select an industry</option>
          {INDUSTRIES.map((industry) => (
            <option key={industry} value={industry}>
              {industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Tell us about your business..."
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
          Website (optional)
        </label>
        <input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label htmlFor="operating_hours" className="block text-sm font-medium text-gray-700 mb-2">
          Operating Hours (optional)
        </label>
        <input
          id="operating_hours"
          type="text"
          value={formData.operating_hours}
          onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Mon-Fri 9am-5pm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.industry || !formData.description || !formData.location}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}

