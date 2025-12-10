'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi, tenantApi, ApiError } from '@/lib/api';
import { OnboardingWizard } from './OnboardingWizard';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === '/app/onboarding';

  // Check both auth.me and onboardingStatus to catch completion faster
  const { data: userData, isLoading: isLoadingAuth, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const { data: onboardingStatus, isLoading: isLoadingStatus, error: onboardingError } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
    retry: false,
  });

  const onboardingErrorStatus = onboardingError instanceof ApiError ? onboardingError.status : undefined;
  const onboardingServiceUnavailable = typeof onboardingErrorStatus === 'number' && onboardingErrorStatus >= 500;

  const isLoading = !onboardingServiceUnavailable && (isLoadingAuth || isLoadingStatus);

  // If we're on the onboarding page, let it handle its own rendering
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // Don't block if there's an auth error (TenantProvider will handle it)
  // Use a safer check that works in test environments
  // Check for status property directly to avoid instanceof issues in tests
  if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 401) {
    return <>{children}</>;
  }

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (onboardingServiceUnavailable) {
    console.warn('[OnboardingGuard] Onboarding status unavailable (5xx). Allowing access.');
    return <>{children}</>;
  }

  // Check onboarding status from both sources - default to false if both are missing
  // onboardingStatus is more reliable as it's updated immediately when onboarding completes
  // Explicitly check for === true to prevent new users from skipping onboarding
  // Only treat as complete if explicitly true, not undefined/null
  const onboardingComplete = onboardingStatus?.complete === true || userData?.onboarding?.complete === true;
  
  const currentStep = onboardingStatus?.step || userData?.onboarding?.step;
  
  // Filter out 'complete' step - OnboardingWizard doesn't accept it
  const validStep = currentStep && currentStep !== 'complete' ? currentStep : undefined;

  // Debug logging
  console.log('[OnboardingGuard] Status check:', {
    pathname,
    onboardingStatusComplete: onboardingStatus?.complete,
    userDataComplete: userData?.onboarding?.complete,
    onboardingComplete,
    isLoading,
  });

  // If onboarding is not complete, show wizard as overlay blocking other pages
  if (!onboardingComplete) {
    return (
      <>
        <OnboardingWizard initialStep={validStep as 'industry' | 'business_profile' | 'persona' | 'business_details' | 'social_connect' | undefined} />
        {/* Render children behind the modal so layout doesn't break */}
        <div className="opacity-0 pointer-events-none">{children}</div>
      </>
    );
  }

  // Onboarding is complete, allow access
  return <>{children}</>;
}

