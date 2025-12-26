'use client';

import { useState, FormEvent, useEffect } from 'react';
import Select from '../ui/Select';

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

const COMMON_LOCATIONS = [
  { value: 'Lagos, Nigeria', label: 'Lagos, Nigeria' },
  { value: 'Abuja, Nigeria', label: 'Abuja, Nigeria' },
  { value: 'Port Harcourt, Nigeria', label: 'Port Harcourt, Nigeria' },
  { value: 'Ibadan, Nigeria', label: 'Ibadan, Nigeria' },
  { value: 'Kano, Nigeria', label: 'Kano, Nigeria' },
  { value: 'Accra, Ghana', label: 'Accra, Ghana' },
  { value: 'Nairobi, Kenya', label: 'Nairobi, Kenya' },
  { value: 'Cairo, Egypt', label: 'Cairo, Egypt' },
  { value: 'Johannesburg, South Africa', label: 'Johannesburg, South Africa' },
  { value: 'Cape Town, South Africa', label: 'Cape Town, South Africa' },
  { value: 'Dar es Salaam, Tanzania', label: 'Dar es Salaam, Tanzania' },
  { value: 'Kampala, Uganda', label: 'Kampala, Uganda' },
  { value: 'Addis Ababa, Ethiopia', label: 'Addis Ababa, Ethiopia' },
  { value: 'Casablanca, Morocco', label: 'Casablanca, Morocco' },
  { value: 'Tunis, Tunisia', label: 'Tunis, Tunisia' },
  { value: 'Dakar, Senegal', label: 'Dakar, Senegal' },
  { value: 'Abidjan, Côte d\'Ivoire', label: 'Abidjan, Côte d\'Ivoire' },
  { value: 'Luanda, Angola', label: 'Luanda, Angola' },
  { value: 'Kinshasa, DRC', label: 'Kinshasa, DRC' },
  { value: 'Other', label: 'Other (specify below)' },
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
  onBack,
  isSubmitting,
  initialData,
}: {
  onComplete: (step: 'business_profile', data: BusinessProfileData) => void;
  onBack?: () => void;
  isSubmitting: boolean;
  initialData?: {
    name?: string;
    industry?: string;
    description?: string;
    location?: string;
    website?: string;
    operating_hours?: string;
  };
}) {
  const [formData, setFormData] = useState<BusinessProfileData>({
    name: initialData?.name || '',
    industry: initialData?.industry || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    website: initialData?.website || '',
    operating_hours: initialData?.operating_hours || '',
  });
  const [customLocation, setCustomLocation] = useState('');

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        industry: initialData.industry || '',
        description: initialData.description || '',
        location: initialData.location || '',
        website: initialData.website || '',
        operating_hours: initialData.operating_hours || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Use customLocation if "Other" was selected, otherwise use formData.location
    const finalLocation = formData.location === 'Other' && customLocation ? customLocation : formData.location;
    if (!formData.name || !formData.industry || !formData.description || !finalLocation) {
      return;
    }
    onComplete('business_profile', { ...formData, location: finalLocation });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🏢</span>
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
          placeholder="Enter your business name"
        />
      </div>

      <div>
        <label htmlFor="industry" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🏭</span>
          Industry <span className="text-red-500">*</span>
        </label>
        <Select
          id="industry"
          value={formData.industry}
          onChange={(value) => setFormData({ ...formData, industry: value })}
          placeholder="Select an industry"
          options={INDUSTRIES.map((industry) => ({
            value: industry,
            label: industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' '),
          }))}
          searchable
        />
      </div>

      <div>
        <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">📝</span>
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300 resize-none"
          placeholder="Tell us about your business, what you do, and what makes you unique..."
        />
        <p className="mt-2 text-xs text-gray-500">Help us understand your business better</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
            <span className="text-primary">📍</span>
            Location <span className="text-red-500">*</span>
          </label>
          <Select
            id="location"
            value={formData.location && COMMON_LOCATIONS.some(loc => loc.value === formData.location) ? formData.location : (formData.location ? 'Other' : '')}
            onChange={(value) => {
              if (value === 'Other') {
                setFormData({ ...formData, location: 'Other' });
                setCustomLocation('');
              } else if (value) {
                setFormData({ ...formData, location: value });
                setCustomLocation('');
              } else {
                setFormData({ ...formData, location: '' });
                setCustomLocation('');
              }
            }}
            placeholder="Select your location"
            options={COMMON_LOCATIONS}
            searchable
          />
          {formData.location === 'Other' && (
            <input
              type="text"
              value={customLocation}
              onChange={(e) => {
                setCustomLocation(e.target.value);
                setFormData({ ...formData, location: e.target.value || 'Other' });
              }}
              className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
              placeholder="Enter your location (City, Country)"
              autoFocus
            />
          )}
        </div>

        <div>
          <label htmlFor="website" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
            <span className="text-primary">🌐</span>
            Website <span className="text-xs text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="operating_hours" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
          <span className="text-primary">🕐</span>
          Operating Hours <span className="text-xs text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id="operating_hours"
          type="text"
          value={formData.operating_hours}
          onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-gray-300"
          placeholder="Mon-Fri 9am-5pm, Sat 10am-2pm"
        />
        <p className="mt-2 text-xs text-gray-500">Let customers know when you&apos;re available</p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-100">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <div className="flex-1" />
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.industry || !formData.description || !formData.location}
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

