'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { WhatsAppProfilePicture } from './WhatsAppProfilePicture';
import Select, { SelectOption } from './ui/Select';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui/Modal';

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

  // Sync preview state
  const [showPreview, setShowPreview] = useState(false);

  // Preview query
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['whatsapp-sync-preview'],
    queryFn: async () => {
      try {
        return await tenantApi.previewWhatsAppProfileSync();
      } catch (err: any) {
        if (err?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: showPreview, // Only fetch when modal is open
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => tenantApi.syncBrancrToWhatsApp(),
    onSuccess: (data) => {
      setShowPreview(false);
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-sync-preview'] });
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-profile-about'] });
      toast.success(data.message || 'Profile synced successfully to WhatsApp!');
    },
    onError: (err: any) => {
      if (err?.status === 404) {
        if (err?.body?.error === 'no_whatsapp_app') {
          toast.error('WhatsApp not connected. Please connect WhatsApp first.');
        } else if (err?.body?.error === 'no_business_profile') {
          toast.error('Business profile not found. Please complete onboarding first.');
        } else {
          toast.error('WhatsApp not connected. Please connect WhatsApp first.');
        }
      } else {
        const errorMessage = err?.message || err?.body?.message || 'Failed to sync profile';
        toast.error(`Sync failed: ${errorMessage}`);
      }
    },
  });

  const fieldsToChange = previewData?.preview?.fields.filter(f => f.will_change) || [];
  const hasChanges = fieldsToChange.length > 0;

  return (
    <div className="space-y-6">
      {/* Show error message if no WhatsApp app found, but still show the form */}
      {((profileError && (profileError as any)?.status === 404) || 
        (aboutError && (aboutError as any)?.status === 404)) && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-dark-accent-warning/50 dark:bg-dark-accent-warning/10">
          <p className="text-sm text-yellow-800 dark:text-dark-accent-warning">
            <strong>Note:</strong> WhatsApp profile features require a connected WhatsApp Business account. Some features may not be available until the account is fully set up.
          </p>
        </div>
      )}

      {/* Profile Picture Section */}
      <WhatsAppProfilePicture />

      {/* Sync Business Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Business Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
            Use your onboarding details to populate your WhatsApp profile automatically.
          </p>
          <Button
            onClick={() => setShowPreview(true)}
            variant="secondary"
            className="w-full"
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Preview & Sync to WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Profile Details Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Business Profile</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin dark:border-white" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-2" htmlFor="address-line-1">
                  Street Address
                </label>
                <input
                  id="address-line-1"
                  type="text"
                  value={formData.add_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, add_line1: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:bg-dark-elevated dark:focus:border-dark-accent-primary dark:placeholder:text-dark-text-secondary"
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
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-dark-accent-error/10 dark:border-dark-accent-error/50">
                <p className="text-sm text-red-800 dark:text-dark-accent-error">{error}</p>
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">About Text</h3>
        
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
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                {about.length}/512 characters
              </p>
              {about.length > 512 && (
                <p className="text-xs text-red-600 dark:text-dark-accent-error">Exceeds maximum length</p>
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

      {/* Preview Sync Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} size="lg">
        <ModalHeader onClose={() => setShowPreview(false)}>
          <ModalTitle>Preview Profile Sync</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin dark:border-dark-accent-primary" />
              <span className="ml-3 text-sm text-gray-600 dark:text-dark-text-secondary">Loading preview...</span>
            </div>
          ) : previewData?.preview ? (
            <div className="space-y-4">
              {/* Summary Alert */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-dark-accent-primary/50 dark:bg-dark-accent-primary/10">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 dark:text-dark-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 dark:text-dark-accent-primary">
                    {previewData.preview.summary}
                  </p>
                </div>
              </div>

              {/* Fields Table */}
              <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-elevated">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Field</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Brancr Value</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Current WhatsApp</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview.fields.map((field, idx) => (
                        <tr key={idx} className="border-t border-gray-200 dark:border-dark-border">
                          <td className="p-3 text-sm font-medium text-gray-900 dark:text-dark-text-primary">{field.name}</td>
                          <td className="p-3 text-sm text-gray-700 dark:text-dark-text-secondary">
                            {field.brancr_value || (
                              <span className="text-gray-400 dark:text-dark-text-secondary italic">Not set</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-700 dark:text-dark-text-secondary">
                            {field.whatsapp_value ? (
                              <span className="text-gray-600 dark:text-dark-text-secondary">{field.whatsapp_value}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-dark-text-secondary italic">Not set</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {field.will_change ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-dark-accent-primary/20 dark:text-white">
                                Will update
                              </span>
                            ) : (
                              <svg className="h-5 w-5 text-green-600 dark:text-dark-accent-success mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!hasChanges && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-dark-accent-success/50 dark:bg-dark-accent-success/10">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-green-600 dark:text-dark-accent-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 dark:text-dark-accent-success">
                      Your WhatsApp profile already matches your business profile. No changes needed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-dark-accent-error/50 dark:bg-dark-accent-error/10">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 dark:text-dark-accent-error mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800 dark:text-dark-accent-error">
                  Failed to load preview. Please try again.
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowPreview(false)}
            disabled={syncMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !hasChanges}
            isLoading={syncMutation.isPending}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync to WhatsApp'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

