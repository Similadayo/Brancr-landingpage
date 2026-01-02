'use client';

import OnboardingSuccess from '../../components/onboarding/OnboardingSuccess';

// ... (other imports)

export default function MagicProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: industries = [] } = useIndustries();

  // State
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  // ... (rest of state)

  // ... (useEffect for redirect)
  useEffect(() => {
    // Redirect if complete AND NOT viewing success screen
    if (!isLoadingStatus && onboardingStatus?.complete === true && step !== 'success') {
      router.replace('/app');
    }
  }, [isLoadingStatus, onboardingStatus, router, step]);

  // ... (handleGenerate)

  const handleConfirm = async () => {
    if (!profileData) return;

    setLoading(true);
    try {
      // ... (saving business profile, industry, persona)
      await tenantApi.onboardingBusinessProfile({
        name: editName.trim(),
        description: editDescription.trim(),
        industry: profileData.industry,
        location: 'Online',
        website: url.trim() || undefined,
      });

      // 2. Save Industry (map name to ID)
      let industriesList = industries;
      if (!industriesList || industriesList.length === 0) {
        try {
          const response = await tenantApi.getIndustries();
          industriesList = response.industries || [];
        } catch (err) {
          console.warn('Failed to fetch industries, using fallback:', err);
          industriesList = FALLBACK_INDUSTRIES;
        }
      }

      if (!industriesList || industriesList.length === 0) {
        industriesList = FALLBACK_INDUSTRIES;
      }

      const matchedIndustry = industriesList.find(
        (ind) => ind.name.toLowerCase() === profileData.industry.toLowerCase() ||
          ind.name.toLowerCase().includes(profileData.industry.toLowerCase())
      );

      if (matchedIndustry) {
        await tenantApi.onboardingIndustry({ industry_id: matchedIndustry.id });
      } else {
        if (FALLBACK_INDUSTRIES[0]) {
          await tenantApi.onboardingIndustry({ industry_id: FALLBACK_INDUSTRIES[0].id });
        }
      }

      // 3. Save Persona
      await tenantApi.onboardingPersona({
        bot_name: editName.trim() + ' AI',
        tone: profileData.persona.tone || 'Professional',
        language: 'English',
        style_notes: `Target Audience: ${profileData.persona.audience}. Core Values: ${Array.isArray(profileData.persona.values) ? profileData.persona.values.join(', ') : profileData.persona.values || ''}`,
      });

      // 4. Mark onboarding complete
      await tenantApi.onboardingComplete();

      // 5. Refresh queries and show success screen
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });

      toast.success('Profile created successfully! 🎉');
      setStep('success'); // Navigate to success screen instead of Dashboard

    } catch (err) {
      console.error('Confirm Error:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ... (loading check)

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
        className="relative z-10 w-full max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 'success' ? (
              <OnboardingSuccess key="success" onComplete={() => router.push('/app')} />
            ) : step === 'input' ? (
              <motion.div
                key="input"
                // ... (input step content)

                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                      <span className="text-3xl sm:text-4xl">✨</span>
                    </div>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Let&apos;s set up your business
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Enter your website or describe what you do, and we&apos;ll use AI to set up your profile automatically.
                  </p>
                </div>

                {/* Input Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Website or Social Link
                    </label>
                    <div className="flex gap-3 mb-2">
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-bg dark:border-dark-border dark:text-white"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="website">Website</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="linkedin">LinkedIn</option>
                      </select>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder={
                            platform === 'instagram' ? '@username' :
                              platform === 'website' ? 'yourbusiness.com' :
                                'Link or handle...'
                          }
                          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-bg dark:border-dark-border dark:text-white"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Enter your website URL, any social media link, or just your handle</p>
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
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || (!url && !description)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 sm:py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
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
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2.5 sm:p-3 rounded-full">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Here&apos;s what we found 🎯
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
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
                <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Industry:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{profileData?.industry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tone:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{profileData?.persona.tone}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Audience:</span>
                        <p className="font-medium text-gray-900 dark:text-white leading-relaxed">{profileData?.persona.audience}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setStep('input')}
                    disabled={loading}
                    className="order-2 sm:order-1 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg text-center"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="order-1 sm:order-2 flex-1 rounded-xl bg-primary px-5 sm:px-6 py-2.5 sm:py-3 text-white font-semibold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 text-center"
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
