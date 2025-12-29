'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { WhatsAppProfilePicture } from './WhatsAppProfilePicture';

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

  // Show error if no WhatsApp app found
  if ((profileError && (profileError as any)?.status === 404) || 
      (aboutError && (aboutError as any)?.status === 404)) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Profile</h3>
          <p className="text-sm text-gray-600">
            No WhatsApp app found for this tenant. Please connect WhatsApp first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <WhatsAppProfilePicture />

      {/* Profile Details Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Profile</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.add_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, add_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.add_line2 || ''}
                  onChange={(e) => setFormData({ ...formData, add_line2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Suite 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Code
                </label>
                <input
                  type="text"
                  value={formData.pin_code || ''}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="USA"
                />
              </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vertical
                </label>
                <select
                  value={formData.vertical || ''}
                  onChange={(e) => setFormData({ ...formData, vertical: e.target.value as Vertical })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select vertical...</option>
                  {VERTICALS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.profile_email || ''}
                  onChange={(e) => setFormData({ ...formData, profile_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="contact@business.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website 1
                </label>
                <input
                  type="url"
                  value={formData.website1 || ''}
                  onChange={(e) => setFormData({ ...formData, website1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website 2
                </label>
                <input
                  type="url"
                  value={formData.website2 || ''}
                  onChange={(e) => setFormData({ ...formData, website2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example2.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.desc || ''}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Business description"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}
      </div>

      {/* Profile About Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About Text</h3>
        
        <div className="space-y-4">
          <div>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={512}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief business description (max 512 characters)"
            />
            <div className="mt-1 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {about.length}/512 characters
              </p>
              {about.length > 512 && (
                <p className="text-xs text-red-600">Exceeds maximum length</p>
              )}
            </div>
          </div>

          <button
            onClick={handleUpdateAbout}
            disabled={updating || about.length === 0 || about.length > 512}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? 'Updating...' : 'Update About'}
          </button>
        </div>
      </div>
    </div>
  );
}

