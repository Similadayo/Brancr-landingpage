'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function WhatsAppProfilePicture() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load existing profile picture
  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['whatsapp-profile-picture'],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappProfilePicture();
      } catch (err: any) {
        // Handle 404 gracefully - no WhatsApp app found
        if (err?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Update photo URL when data loads
  useEffect(() => {
    if (data?.photo_url) {
      setPhotoUrl(data.photo_url);
    } else {
      setPhotoUrl(null);
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      return await tenantApi.updateWhatsAppProfilePicture(file);
    },
    onSuccess: () => {
      toast.success('Profile picture updated successfully!');
      // Reload the profile picture
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-profile-picture'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.message || err?.body?.message || 'Failed to update profile picture';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    updateMutation.mutate(file);
  }

  const loading = isLoading || updateMutation.isPending;

  // Show error if no WhatsApp app found
  if (fetchError && (fetchError as any)?.status === 404) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Profile Picture</h3>
        <p className="text-sm text-gray-600">
          No WhatsApp app found for this tenant. Please connect WhatsApp first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">WhatsApp Profile Picture</h3>
      
      <div className="space-y-4">
        {/* Current Profile Picture */}
        {photoUrl && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={photoUrl}
                alt="Profile Picture"
                className="w-32 h-32 object-cover rounded-full border-2 border-gray-200 dark:border-gray-600"
                onError={() => setPhotoUrl(null)}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 bg-opacity-75 dark:bg-opacity-75 rounded-full">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin dark:border-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Profile Picture</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This is your current WhatsApp profile picture</p>
            </div>
          </div>
        )}

        {!photoUrl && !loading && (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-500">
              <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No Profile Picture</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload a profile picture to display it here</p>
            </div>
          </div>
        )}

        {/* Upload Input */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Upload New Picture</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:file:bg-white dark:file:text-gray-900 dark:hover:file:bg-gray-100"
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum file size: 10MB. Supported formats: JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin dark:border-white" />
            <span>{updateMutation.isPending ? 'Uploading...' : 'Loading...'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

