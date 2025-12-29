'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { WhatsAppProfilePicture } from './WhatsAppProfilePicture';
import Select, { SelectOption } from './ui/Select';
import { Button } from './ui/Button';

type Vertical = 
  | "OTHER" | "AUTO" | "BEAUTY" | "APPAREL" | "EDU" | "ENTERTAIN" 
  | "EVENT_PLAN" | "FINANCE" | "GROCERY" | "GOVT" | "HOTEL" 
  | "HEALTH" | "NONPROFIT" | "PROF_SERVICES" | "RETAIL" 
  | "TRAVEL" | "RESTAURANT";

interface ProfileDetails {
  address: string;
  profileEmail: string;
  desc: string;
  vertical: string;
  website1: string;
  website2: string;
}

interface UpdateProfileRequest {
  add_line1?: string;
  add_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  vertical?: Vertical;
  website1?: string;
  website2?: string;
  desc?: string;
  profile_email?: string;
}

const VERTICALS: Vertical[] = [
  "OTHER", "AUTO", "BEAUTY", "APPAREL", "EDU", "ENTERTAIN",
  "EVENT_PLAN", "FINANCE", "GROCERY", "GOVT", "HOTEL",
  "HEALTH", "NONPROFIT", "PROF_SERVICES", "RETAIL",
  "TRAVEL", "RESTAURANT"
];

const VERTICAL_OPTIONS: SelectOption<Vertical>[] = [
  { value: "OTHER", label: "Other" },
  { value: "AUTO", label: "Automotive" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "APPAREL", label: "Apparel" },
  { value: "EDU", label: "Education" },
  { value: "ENTERTAIN", label: "Entertainment" },
  { value: "EVENT_PLAN", label: "Event Planning" },
  { value: "FINANCE", label: "Finance" },
  { value: "GROCERY", label: "Grocery" },
  { value: "GOVT", label: "Government" },
  { value: "HOTEL", label: "Hotel" },
  { value: "HEALTH", label: "Health" },
  { value: "NONPROFIT", label: "Nonprofit" },
  { value: "PROF_SERVICES", label: "Professional Services" },
  { value: "RETAIL", label: "Retail" },
  { value: "TRAVEL", label: "Travel" },
  { value: "RESTAURANT", label: "Restaurant" },
];

// Helper function to parse address into components
function parseAddress(address: string) {
  if (!address) return { add_line1: '', city: '', state: '', pin_code: '', country: '' };
  
  // Try to parse common address formats
  const parts = address.split(',').map(s => s.trim());
  return {
    add_line1: parts[0] || '',
    add_line2: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    pin_code: parts[4] || '',
    country: parts[5] || '',
  };
}

export function WhatsAppProfile() {
  const [formData, setFormData] = useState<UpdateProfileRequest & { add_line2?: string }>({});
  const [about, setAbout] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load profile details
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['whatsapp-profile'],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappProfile();
      } catch (err: any) {
        if (err?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Load profile about
  const { data: aboutData, isLoading: isLoadingAbout, error: aboutError } = useQuery({
    queryKey: ['whatsapp-profile-about'],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappProfileAbout();
      } catch (err: any) {
        if (err?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profileData?.profile) {
      const profile = profileData.profile;
      const addressParts = parseAddress(profile.address);
      setFormData({
        add_line1: addressParts.add_line1,
        add_line2: addressParts.add_line2,
        city: addressParts.city,
        state: addressParts.state,
        pin_code: addressParts.pin_code,
        country: addressParts.country,
        vertical: profile.vertical as Vertical,
        website1: profile.website1,
        website2: profile.website2,
        desc: profile.desc,
        profile_email: profile.profileEmail,
      });
    }
  }, [profileData]);

  // Initialize about text when it loads
  useEffect(() => {
    if (aboutData?.about !== undefined) {
      setAbout(aboutData.about);
    }
  }, [aboutData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateProfileRequest) => {
      return await tenantApi.updateWhatsAppProfile(updates);
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-profile'] });
      // Update form data with response
      if (data.profile) {
        const addressParts = parseAddress(data.profile.address);
        setFormData(prev => ({
          ...prev,
          ...addressParts,
          vertical: data.profile.vertical as Vertical,
          website1: data.profile.website1,
          website2: data.profile.website2,
          desc: data.profile.desc,
          profile_email: data.profile.profileEmail,
        }));
      }
    },
    onError: (err: any) => {
      const errorMessage = err?.message || err?.body?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Update about mutation
  const updateAboutMutation = useMutation({
    mutationFn: async (aboutText: string) => {
      if (aboutText.length > 512) {
        throw new Error('About text must not exceed 512 characters');
      }
      return await tenantApi.updateWhatsAppProfileAbout(aboutText);
    },
    onSuccess: (data) => {
      toast.success('About text updated successfully!');
      setAbout(data.about);
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-profile-about'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.message || err?.body?.message || 'Failed to update about text';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Build updates object with only non-empty fields
    const updates: UpdateProfileRequest = {};
    if (formData.add_line1) updates.add_line1 = formData.add_line1;
    if (formData.add_line2) updates.add_line2 = formData.add_line2;
    if (formData.city) updates.city = formData.city;
    if (formData.state) updates.state = formData.state;
    if (formData.pin_code) updates.pin_code = formData.pin_code;
    if (formData.country) updates.country = formData.country;
    if (formData.vertical) updates.vertical = formData.vertical;
    if (formData.website1) updates.website1 = formData.website1;
    if (formData.website2) updates.website2 = formData.website2;
    if (formData.desc) updates.desc = formData.desc;
    if (formData.profile_email) updates.profile_email = formData.profile_email;

    updateProfileMutation.mutate(updates);
  }

  function handleUpdateAbout() {
    if (about.length > 512) {
      setError('About text must not exceed 512 characters');
      toast.error('About text must not exceed 512 characters');
      return;
    }
    setError(null);
    updateAboutMutation.mutate(about);
  }

  const loading = isLoadingProfile || isLoadingAbout;
  const updating = updateProfileMutation.isPending || updateAboutMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Show error message if no WhatsApp app found, but still show the form */}
      {((profileError && (profileError as any)?.status === 404) || 
        (aboutError && (aboutError as any)?.status === 404)) && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> WhatsApp profile features require a connected WhatsApp Business account. Some features may not be available until the account is fully set up.
          </p>
        </div>
      )}

      {/* Profile Picture Section */}
      <WhatsAppProfilePicture />

      {/* Profile Details Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Profile</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin dark:border-white" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="address-line-1">
                  Street Address
                </label>
                <input
                  id="address-line-1"
                  type="text"
                  value={formData.add_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, add_line1: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="address-line-2">
                  Apartment, Suite, or Unit (Optional)
                </label>
                <input
                  id="address-line-2"
                  type="text"
                  value={formData.add_line2 || ''}
                  onChange={(e) => setFormData({ ...formData, add_line2: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="Suite 100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="state">
                  State or Province
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="postal-code">
                  Postal Code or ZIP Code
                </label>
                <input
                  id="postal-code"
                  type="text"
                  value={formData.pin_code || ''}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="United States"
                />
              </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="business-vertical">
                  Business Category
                </label>
                <Select
                  id="business-vertical"
                  value={formData.vertical || ''}
                  onChange={(value) => setFormData({ ...formData, vertical: value as Vertical })}
                  options={VERTICAL_OPTIONS}
                  placeholder="Select business category..."
                  searchable
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="business-email">
                  Business Email Address
                </label>
                <input
                  id="business-email"
                  type="email"
                  value={formData.profile_email || ''}
                  onChange={(e) => setFormData({ ...formData, profile_email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="contact@business.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="primary-website">
                  Primary Website
                </label>
                <input
                  id="primary-website"
                  type="url"
                  value={formData.website1 || ''}
                  onChange={(e) => setFormData({ ...formData, website1: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="secondary-website">
                  Secondary Website (Optional)
                </label>
                <input
                  id="secondary-website"
                  type="url"
                  value={formData.website2 || ''}
                  onChange={(e) => setFormData({ ...formData, website2: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                  placeholder="https://example2.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="business-description">
                Business Description
              </label>
              <textarea
                id="business-description"
                value={formData.desc || ''}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                rows={5}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
                placeholder="Tell us about your business..."
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updating}
                className="btn-primary"
              >
                {updating ? 'Updating...' : 'Update Profile Details'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Profile About Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About Text</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" htmlFor="about-text">
              About Text
            </label>
            <textarea
              id="about-text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={512}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-600 dark:focus:border-primary dark:placeholder:text-gray-400"
              placeholder="Brief business description (max 512 characters)"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {about.length}/512 characters
              </p>
              {about.length > 512 && (
                <p className="text-xs text-red-600 dark:text-red-400">Exceeds maximum length</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleUpdateAbout}
              disabled={updating || about.length === 0 || about.length > 512}
              className="btn-primary"
            >
              {updating ? 'Updating...' : 'Update About Text'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

