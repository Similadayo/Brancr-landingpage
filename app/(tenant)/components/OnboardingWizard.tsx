'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi, ApiError } from '@/lib/api';
import { useTenantIndustry } from '../hooks/useIndustry';
import { IndustryStep } from './onboarding/IndustryStep';
import { BusinessProfileStep } from './onboarding/BusinessProfileStep';
import { PersonaStep } from './onboarding/PersonaStep';
import { BusinessDetailsStep } from './onboarding/BusinessDetailsStep';
import { SocialConnectStep } from './onboarding/SocialConnectStep';

type OnboardingStep = 'industry' | 'business_profile' | 'persona' | 'business_details' | 'social_connect';

const STEPS: Array<{ id: OnboardingStep; title: string; description: string; icon: string }> = [
  {
    id: 'industry',
    title: 'Industry Selection',
    description: 'Choose your business type',
    icon: '🏭',
  },
  {
    id: 'business_profile',
    title: 'Business Profile',
    description: 'Tell us about your business',
    icon: '🏢',
  },
  {
    id: 'persona',
    title: 'AI Persona',
    description: 'Customize your AI assistant',
    icon: '🤖',
  },
  {
    id: 'business_details',
    title: 'Business Details',
    description: 'Add menu items, FAQs, and more (optional)',
    icon: '📋',
  },
  {
    id: 'social_connect',
    title: 'Connect Social Media',
    description: 'Link your channels to get started',
    icon: '🔗',
  },
];

export function OnboardingWizard({ initialStep }: { initialStep?: OnboardingStep }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Initialize with 'industry' as default for new users
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || 'industry');
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

  // Load tenant industry separately
  const { data: tenantIndustry } = useTenantIndustry();

  // Update current step and saved data when status loads
  useEffect(() => {
    if (onboardingStatus) {
      // Debug logging
      console.log('[OnboardingWizard] Status loaded:', {
        complete: onboardingStatus.complete,
        step: onboardingStatus.step,
        hasBusinessProfile: !!onboardingStatus.business_profile,
        hasPersona: !!onboardingStatus.persona,
      });
      
      // Set current step from status (backend knows the current step)
      // Note: backend step doesn't include 'industry', so we default to 'industry' for new users
      // If onboarding is complete, we shouldn't be here (should redirect), but handle it anyway
      if (onboardingStatus.complete) {
        console.log('[OnboardingWizard] Onboarding complete, should redirect');
        return; // Let the redirect handle this
      }
      
      // Backend returns steps after 'industry', so if step is undefined, user is on 'industry' step
      const stepFromStatus = onboardingStatus.step || 'industry';
      console.log('[OnboardingWizard] Setting step to:', stepFromStatus);
      setCurrentStep(stepFromStatus as OnboardingStep);
      
      // Load saved data for pre-filling forms
      setSavedData({
        industry: tenantIndustry?.industry_id ? { industry_id: tenantIndustry.industry_id } : undefined,
        business_profile: onboardingStatus.business_profile,
        persona: onboardingStatus.persona,
        business_details: onboardingStatus.business_details,
      });
    } else if (!isLoadingStatus && !onboardingError) {
      // If status hasn't loaded yet but we're not in error state, ensure we have a default step
      // This handles the case where the API call hasn't completed yet
      console.log('[OnboardingWizard] No status yet, using default step');
      if (currentStep === 'industry' || !currentStep) {
        setCurrentStep('industry');
      }
    }
  }, [onboardingStatus, tenantIndustry, initialStep, isLoadingStatus, onboardingError, currentStep]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleStepComplete = async (step: OnboardingStep, data: unknown) => {
    setIsSubmitting(true);
    try {
      let response;
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
      
      // Show success message from API
      if ((response as any)?.message) {
        toast.success((response as any).message);
      }
      
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
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to save step');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to complete onboarding');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
 };

  const renderStep = () => {
    // Debug logging
    console.log('[OnboardingWizard] renderStep called:', {
      isLoadingStatus,
      hasError: !!onboardingError,
      currentStep,
      currentStepIndex,
      hasOnboardingStatus: !!onboardingStatus,
    });

    if (isLoadingStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-4" />
          <p className="text-sm text-gray-600">Loading onboarding...</p>
        </div>
      );
    }

    if (onboardingError) {
      console.error('[OnboardingWizard] Error loading status:', onboardingError);
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
      console.warn('[OnboardingWizard] Invalid step, defaulting to industry:', currentStep);
      return (
        <IndustryStep
          onComplete={(data) => handleStepComplete('industry', data)}
          isLoading={isSubmitting}
          savedData={savedData.industry}
        />
      );
    }

    switch (currentStep) {
      case 'industry':
        return (
          <IndustryStep
            onComplete={(data) => handleStepComplete('industry', data)}
            isLoading={isSubmitting}
            savedData={savedData.industry}
          />
        );
      case 'business_profile':
        return (
          <BusinessProfileStep
            onComplete={handleStepComplete}
            isSubmitting={isSubmitting}
            initialData={savedData.business_profile}
          />
        );
      case 'persona':
        return (
          <PersonaStep
            onComplete={handleStepComplete}
            isSubmitting={isSubmitting}
            initialData={savedData.persona}
          />
        );
      case 'business_details':
        return (
          <BusinessDetailsStep
            onComplete={handleStepComplete}
            isSubmitting={isSubmitting}
            initialData={savedData.business_details}
          />
        );
      case 'social_connect':
        return (
          <SocialConnectStep
            onComplete={handleSocialConnectComplete}
            isSubmitting={isSubmitting}
            hasTelegramBot={onboardingStatus?.has_telegram_bot}
          />
        );
      default:
        return null;
    }
  };

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
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 mx-auto"
      >
        {/* Gradient Progress Bar */}
        <div className="h-1.5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/30"
          />
        </div>

        {/* Beautiful Header */}
        <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-100 px-8 py-6">
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
                  className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                >
                  {STEPS[currentStepIndex]?.title}
                </motion.h2>
                <motion.p
                  key={`${currentStep}-desc`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-1 text-sm text-gray-600"
                >
                  {STEPS[currentStepIndex]?.description}
                </motion.p>
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
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary shadow-lg shadow-primary/50'
                          : isCurrent
                          ? 'bg-primary ring-4 ring-primary/20 scale-125'
                          : 'bg-gray-200'
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
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 min-w-[60px] text-right">
              {currentStepIndex + 1} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Content with smooth transitions */}
        <div className="overflow-y-auto max-h-[calc(92vh-180px)] bg-gradient-to-b from-white to-gray-50/50">
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

