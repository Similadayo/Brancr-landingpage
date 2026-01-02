'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi, authApi, ApiError } from '@/lib/api';
import { useIndustries } from '../../hooks/useIndustry';

type ProfileData = {
  name: string;
  description: string;
  industry: string;
  persona: {
    tone: string;
    audience: string;
    values: string[];
  };
  confidence: 'high' | 'medium' | 'low';
};

export default function MagicProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: industries = [] } = useIndustries();

  // State
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Editable confirmation fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Check if onboarding is already complete
  const { data: onboardingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
    retry: false,
  });

  // Redirect if already complete
  useEffect(() => {
    if (!isLoadingStatus && onboardingStatus?.complete === true) {
      router.replace('/app');
    }
  }, [isLoadingStatus, onboardingStatus, router]);

  const handleGenerate = async () => {
    if (!url && !description) {
      setError('Please enter your website or describe your business');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await tenantApi.magicProfile({
        url: url.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (result.success && result.profile) {
        setProfileData(result.profile);
        setEditName(result.profile.name);
        setEditDescription(result.profile.description);
        setStep('confirm');

        if (result.profile.confidence === 'low') {
          setError("We couldn't find much info. Please review carefully.");
        }
      } else {
        toast.error(result.message || 'Failed to generate profile');
      }
    } catch (err) {
      console.error('Magic Profile Error:', err);
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to analyze');
      } else {
        toast.error('Something went wrong. Try manual setup.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!profileData) return;

    setLoading(true);
    try {
      // 1. Save Business Profile
      await tenantApi.onboardingBusinessProfile({
        name: editName.trim(),
        description: editDescription.trim(),
        industry: profileData.industry,
        location: 'Online',
        website: url.trim() || undefined,
      });

      // 2. Save Industry (map name to ID)
      const matchedIndustry = industries.find(
        (ind) => ind.name.toLowerCase() === profileData.industry.toLowerCase()
      );
      if (matchedIndustry) {
        await tenantApi.onboardingIndustry({ industry_id: matchedIndustry.id });
      }

      // 3. Save Persona
      await tenantApi.onboardingPersona({
        bot_name: editName.trim() + ' AI',
        tone: profileData.persona.tone || 'Professional',
        language: 'English',
        style_notes: `Target Audience: ${profileData.persona.audience}. Core Values: ${profileData.persona.values.join(', ')}`,
      });

      // 4. Mark onboarding complete
      await tenantApi.onboardingComplete();

      // 5. Refresh queries and redirect
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });

      toast.success('Welcome to Brancr! 🎉');
      router.push('/app');
    } catch (err) {
      console.error('Confirm Error:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking status
  if (isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-elevated flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-elevated flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden p-8">
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-4 rounded-2xl">
                      <span className="text-4xl">✨</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Let&apos;s set up your business
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Enter your website or describe what you do, and we&apos;ll use AI to set up your profile automatically.
                  </p>
                </div>

                {/* Input Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Website or Social Media URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://instagram.com/yourbusiness"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-bg dark:border-dark-border dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500 dark:bg-dark-surface dark:text-gray-400">Or</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Describe your business
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="We sell handmade vegan candles in Lagos..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-bg dark:border-dark-border dark:text-white resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || (!url && !description)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Analyzing your business...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Auto-Generate Profile</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => router.push('/app/onboarding/manual')}
                    disabled={loading}
                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors py-2"
                  >
                    Prefer to do it manually? →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Here&apos;s what we found 🎯
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Review and edit if needed.
                  </p>
                </div>

                {/* Low confidence warning */}
                {profileData?.confidence === 'low' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex gap-3">
                    <span className="text-yellow-600">⚠️</span>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      We couldn&apos;t find everything. Please double-check the values below.
                    </p>
                  </div>
                )}

                {/* Form */}
                <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-dark-surface dark:border-dark-border dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-dark-surface dark:border-dark-border dark:text-white resize-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Insights</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Industry:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{profileData?.industry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tone:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{profileData?.persona.tone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Audience:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{profileData?.persona.audience}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('input')}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Looks Good! Continue →'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
