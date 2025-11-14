'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { tenantApi, ApiError } from '@/lib/api';
import { BusinessProfileStep } from './onboarding/BusinessProfileStep';
import { PersonaStep } from './onboarding/PersonaStep';
import { BusinessDetailsStep } from './onboarding/BusinessDetailsStep';
import { SocialConnectStep } from './onboarding/SocialConnectStep';

type OnboardingStep = 'business_profile' | 'persona' | 'business_details' | 'social_connect';

const STEPS: Array<{ id: OnboardingStep; title: string; description: string }> = [
  {
    id: 'business_profile',
    title: 'Business Profile',
    description: 'Tell us about your business',
  },
  {
    id: 'persona',
    title: 'AI Persona',
    description: 'Customize your AI assistant',
  },
  {
    id: 'business_details',
    title: 'Business Details',
    description: 'Add menu items, FAQs, and more (optional)',
  },
  {
    id: 'social_connect',
    title: 'Connect Social Media',
    description: 'Link your channels to get started',
  },
];

export function OnboardingWizard({ initialStep }: { initialStep?: OnboardingStep }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || 'business_profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleStepComplete = async (step: OnboardingStep, data: unknown) => {
    setIsSubmitting(true);
    try {
      let response;
      switch (step) {
        case 'business_profile':
          response = await tenantApi.onboardingBusinessProfile(data as any);
          break;
        case 'persona':
          response = await tenantApi.onboardingPersona(data as any);
          break;
        case 'business_details':
          response = await tenantApi.onboardingBusinessDetails(data as any);
          break;
        case 'social_connect':
          // Social connect completion is handled separately
          return;
        default:
          throw new Error('Unknown step');
      }

      setCompletedSteps((prev) => new Set(prev).add(step));
      
      // Invalidate auth query to refresh onboarding status
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      
      // Move to next step
      if (currentStepIndex < STEPS.length - 1) {
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
      await tenantApi.onboardingComplete();
      // Invalidate all relevant queries
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['tenant', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Welcome to Brancr! 🎉');
      router.push('/app');
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
    switch (currentStep) {
      case 'business_profile':
        return <BusinessProfileStep onComplete={handleStepComplete} isSubmitting={isSubmitting} />;
      case 'persona':
        return <PersonaStep onComplete={handleStepComplete} isSubmitting={isSubmitting} />;
      case 'business_details':
        return <BusinessDetailsStep onComplete={handleStepComplete} isSubmitting={isSubmitting} />;
      case 'social_connect':
        return <SocialConnectStep onComplete={handleSocialConnectComplete} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl mx-4">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {STEPS[currentStepIndex]?.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 w-2 rounded-full transition ${
                    index <= currentStepIndex
                      ? 'bg-primary'
                      : index < currentStepIndex
                      ? 'bg-primary/50'
                      : 'bg-gray-300'
                  }`}
                  title={step.title}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

