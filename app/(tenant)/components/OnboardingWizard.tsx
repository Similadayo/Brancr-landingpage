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
  const { data: onboardingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
    retry: false,
  });

  // Load tenant industry separately
  const { data: tenantIndustry } = useTenantIndustry();

  // Update current step and saved data when status loads
  useEffect(() => {
    if (onboardingStatus) {
      // Set current step from status (backend knows the current step)
      const stepFromStatus = onboardingStatus.step || initialStep || 'industry';
      setCurrentStep(stepFromStatus);
      
      // Load saved data for pre-filling forms
      setSavedData({
        industry: tenantIndustry?.industry_id ? { industry_id: tenantIndustry.industry_id } : undefined,
        business_profile: onboardingStatus.business_profile,
        persona: onboardingStatus.persona,
        business_details: onboardingStatus.business_details,
      });
    }
  }, [onboardingStatus, tenantIndustry, initialStep]);

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
    if (isLoadingStatus) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      );
    }

    switch (currentStep) {
      case 'industry':
        return (
          <IndustryStep
            onComplete={handleStepComplete}
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

