'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi, ApiError } from '@/lib/api';
import { getUserFriendlyErrorMessage, ErrorMessages } from '@/lib/error-messages';
import { IndustryStep } from './onboarding/IndustryStep';
import { BusinessProfileStep } from './onboarding/BusinessProfileStep';
import { PersonaStep } from './onboarding/PersonaStep';
import { BusinessDetailsStep } from './onboarding/BusinessDetailsStep';
import { SocialConnectStep } from './onboarding/SocialConnectStep';

type OnboardingStep = 'industry' | 'business_profile' | 'persona' | 'business_details' | 'social_connect' | 'complete';

const STEPS: Array<{ id: OnboardingStep; title: string; description: string; icon: string; optional?: boolean; timeEstimate?: string; benefit?: string }> = [
  {
    id: 'industry',
    title: 'Industry Selection',
    description: 'Choose your business type',
    icon: '🏭',
    timeEstimate: '1 min',
    benefit: 'Customize your workspace',
  },
  {
    id: 'business_profile',
    title: 'Business Profile',
    description: 'Tell us about your business',
    icon: '🏢',
    timeEstimate: '2 min',
    benefit: 'Personalize your experience',
  },
  {
    id: 'persona',
    title: 'AI Persona',
    description: 'Customize your AI assistant',
    icon: '🤖',
    timeEstimate: '2 min',
    benefit: 'Set your AI tone and style',
  },
  {
    id: 'business_details',
    title: 'Business Details',
    description: 'Add FAQs and knowledge base (optional)',
    icon: '📋',
    optional: true,
    timeEstimate: '3 min',
    benefit: 'Improve AI responses',
  },
  {
    id: 'social_connect',
    title: 'Connect Social Media',
    description: 'Link your channels to get started',
    icon: '🔗',
    timeEstimate: '2 min',
    benefit: 'Start managing your social media',
  },
];

export function OnboardingWizard({ initialStep }: { initialStep?: OnboardingStep }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Initialize with 'industry' as default for new users
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || 'magic_input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const [savedData, setSavedData] = useState<{
    industry?: any;
    business_profile?: any;
    persona?: any;
    business_details?: any;
  }>({});




  // Load onboarding status on mount
  const { data: onboardingStatus, isLoading: isLoadingStatus, error: onboardingError } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
    retry: false,
  });

  // NOTE: useTenantIndustry() was removed from here as it causes 403 errors during onboarding.
  // The industry is fetched separately by IndustryStep when needed.

  // Update current step and saved data when status loads
  useEffect(() => {
    if (onboardingStatus) {
      if (onboardingStatus.complete === true) {
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        void queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
        void queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
        void queryClient.refetchQueries({ queryKey: ['onboarding', 'status'] });

        router.replace('/app');
        setTimeout(() => {
          window.location.href = '/app';
        }, 100);
        return;
      }

      if (onboardingStatus.step === 'complete') {
        return;
      }

      const stepFromStatus = onboardingStatus.step || 'industry';
      setCurrentStep(stepFromStatus as OnboardingStep);

      // Load saved data for pre-filling forms
      setSavedData({
        business_profile: onboardingStatus.business_profile,
        persona: onboardingStatus.persona,
        business_details: onboardingStatus.business_details,
      });
    } else if (!isLoadingStatus && !onboardingError) {
      if (!currentStep) {
        setCurrentStep('industry');
      }
    }
  }, [onboardingStatus, initialStep, isLoadingStatus, onboardingError, currentStep, router, queryClient]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleStepComplete = async (step: OnboardingStep, data: unknown, skip = false) => {
    setIsSubmitting(true);
    try {
      let response;

      // If skipping optional step, just move forward
      if (skip && step === 'business_details') {
        setCompletedSteps((prev) => new Set(prev).add(step));
        const nextStep = STEPS[currentStepIndex + 1]?.id;
        if (nextStep) {
          setCurrentStep(nextStep as OnboardingStep);
        }
        setIsSubmitting(false);
        return;
      }

      switch (step) {
        case 'industry':
          response = await tenantApi.onboardingIndustry(data as any);
          break;
        case 'business_profile':
          response = await tenantApi.onboardingBusinessProfile(data as any);
          break;
        case 'persona':
          response = await tenantApi.onboardingPersona(data as any);
          break;
        case 'business_details':
          // Use onboarding endpoint during onboarding, settings endpoint for updates
          response = await tenantApi.onboardingBusinessDetails(data as any);
          break;
        case 'social_connect':
          // Social connect completion is handled separately
          return;
        default:
          throw new Error('Unknown step');
      }

      setCompletedSteps((prev) => new Set(prev).add(step));

      // Show success message with benefit information
      const currentStepData = STEPS.find((s) => s.id === step);
      const benefitMessage = currentStepData?.benefit
        ? `${currentStepData.benefit}! ${(response as any)?.message || 'Step completed successfully.'}`
        : (response as any)?.message || 'Step completed successfully.';
      toast.success(benefitMessage, {
        duration: 4000,
        icon: '✅',
      });

      // Invalidate queries to refresh onboarding status
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });

      // Move to next step from response or default to next step
      const nextStep = (response as any)?.next_step || STEPS[currentStepIndex + 1]?.id;
      if (nextStep && STEPS.find((s) => s.id === nextStep)) {
        setCurrentStep(nextStep as OnboardingStep);
      } else if (currentStepIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentStepIndex + 1].id);
      }
    } catch (error) {
      const stepMessages: Record<OnboardingStep, string> = {
        industry: ErrorMessages.onboarding.industry,
        business_profile: ErrorMessages.onboarding.businessProfile,
        persona: ErrorMessages.onboarding.persona,
        business_details: ErrorMessages.onboarding.businessDetails,
        social_connect: ErrorMessages.onboarding.complete,
        complete: ErrorMessages.onboarding.complete,
      };
      const message = getUserFriendlyErrorMessage(error, {
        action: 'saving onboarding step',
        resource: step,
      });
      toast.error(message || stepMessages[step] || ErrorMessages.onboarding.complete);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    if (STEPS[currentStepIndex]?.optional) {
      handleStepComplete(currentStep, {}, true);
    }
  };

  const handleGoBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSocialConnectComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = await tenantApi.onboardingComplete();
      // Invalidate all relevant queries
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
      void queryClient.invalidateQueries({ queryKey: ['tenant', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success(result.message || 'Welcome to Brancr! 🎉');
      // Redirect to /app or specified redirect URL
      const redirectTo = result.redirect_to || '/app';
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, {
        action: 'completing onboarding',
      });
      toast.error(message || ErrorMessages.onboarding.complete);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    // If onboarding is complete, show redirect message (redirect should happen in useEffect)
    // Explicitly check for === true to prevent new users from skipping onboarding
    if (onboardingStatus?.complete === true) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-green-100 p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboarding Complete!</h3>
          <p className="text-sm text-gray-600">Redirecting to your workspace...</p>
        </div>
      );
    }

    if (isLoadingStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-4" />
          <p className="text-sm text-gray-600">Loading onboarding...</p>
        </div>
      );
    }

    if (onboardingError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load onboarding</h3>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            {onboardingError instanceof ApiError
              ? onboardingError.message || 'An error occurred while loading your onboarding status.'
              : 'Unable to connect to the server. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      );
    }

    // If we don't have a valid step, default to industry
    if (!currentStep || currentStepIndex === -1) {
      return (
        <IndustryStep
          onComplete={(data) => handleStepComplete('industry', data)}
          isLoading={isSubmitting}
          savedData={savedData.industry}
        />
      );
    }

    switch (currentStep) {
      case 'magic_input':
        return (
          <MagicInputStep
            onComplete={(profile) => {
              setMagicProfileData(profile);
              setCurrentStep('magic_confirmation');
            }}
            onSkip={() => {
              // Skip to manual setup -> Industry step
              // We simulate a step update but don't save API data yet as it's just navigation
              setCurrentStep('industry');
            }}
            isLoading={isSubmitting}
          />
        );
      case 'magic_confirmation':
        return magicProfileData ? (
          <MagicConfirmationStep
            data={magicProfileData}
            onComplete={() => {
              // Confirmed! The component handled saving data.
              // Move to social connect (skipping manual steps) OR business details.
              setCurrentStep('social_connect');

              // Invalidate queries to refresh sidebar etc
              void queryClient.invalidateQueries({ queryKey: ['tenant-industry'] });
              void queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
            }}
            onBack={() => setCurrentStep('magic_input')}
            isLoading={isSubmitting}
          />
        ) : (
          // Fallback if data missing
          <div className="flex justify-center p-8">Missing profile data. <button onClick={() => setCurrentStep('magic_input')} className="ml-2 text-primary underline">Go back</button></div>
        );
      case 'industry':
        return (
          <IndustryStep
            onComplete={(data) => handleStepComplete('industry', data)}
            onBack={currentStepIndex > 0 ? handleGoBack : undefined}
            isLoading={isSubmitting}
            savedData={savedData.industry}
          />
        );
      case 'business_profile':
        return (
          <BusinessProfileStep
            onComplete={handleStepComplete}
            onBack={handleGoBack}
            isSubmitting={isSubmitting}
            initialData={savedData.business_profile}
          />
        );
      case 'persona':
        return (
          <PersonaStep
            onComplete={handleStepComplete}
            onBack={handleGoBack}
            isSubmitting={isSubmitting}
            initialData={savedData.persona}
          />
        );
      case 'business_details':
        return (
          <BusinessDetailsStep
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
            onBack={handleGoBack}
            isSubmitting={isSubmitting}
            initialData={savedData.business_details}
          />
        );
      case 'social_connect':
        return (
          <SocialConnectStep
            onComplete={handleSocialConnectComplete}
            onBack={handleGoBack}
            isSubmitting={isSubmitting}
            hasTelegramBot={onboardingStatus?.has_telegram_bot}
          />
        );
      default:
        return null;
    }
  };

  // If onboarding is complete, show redirect message instead of wizard
  // Explicitly check for === true to prevent new users from skipping onboarding
  if (onboardingStatus?.complete === true) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 mx-auto">
          <div className="flex flex-col items-center justify-center py-12 px-8">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboarding Complete!</h3>
            <p className="text-sm text-gray-600">Redirecting to your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 mx-auto dark:bg-dark-surface dark:border-dark-border"
      >
        {/* Gradient Progress Bar */}
        <div className="h-1.5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden dark:from-dark-elevated dark:via-dark-surface dark:to-dark-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/30"
          />
        </div>

        {/* Beautiful Header */}
        <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-100 px-8 py-6 dark:from-dark-elevated dark:via-dark-surface dark:to-dark-elevated dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-4xl"
              >
                {STEPS[currentStepIndex]?.icon}
              </motion.div>
              <div>
                <motion.h2
                  key={currentStep}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300"
                >
                  {STEPS[currentStepIndex]?.title}
                </motion.h2>
                <motion.p
                  key={`${currentStep}-desc`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  {STEPS[currentStepIndex]?.description}
                </motion.p>
                {STEPS[currentStepIndex]?.benefit && (
                  <motion.div
                    key={`${currentStep}-benefit`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 w-fit dark:bg-primary/20"
                  >
                    <svg className="h-4 w-4 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-primary dark:text-primary-light">{STEPS[currentStepIndex]?.benefit}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isUpcoming = index > currentStepIndex;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${isCompleted
                        ? 'bg-primary shadow-lg shadow-primary/50'
                        : isCurrent
                          ? 'bg-primary ring-4 ring-primary/20 scale-125 dark:ring-primary/40'
                          : 'bg-gray-200 dark:bg-dark-border'
                        }`}
                      title={step.title}
                    />
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <svg
                          className="h-2 w-2 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Step Progress Text */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden dark:bg-dark-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 min-w-[60px] text-right dark:text-gray-400">
              {currentStepIndex + 1} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Content with smooth transitions */}
        <div className="overflow-y-auto max-h-[calc(92vh-180px)] bg-gradient-to-b from-white to-gray-50/50 scrollbar-thin dark:from-dark-surface dark:to-dark-elevated">
          <div className="px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

