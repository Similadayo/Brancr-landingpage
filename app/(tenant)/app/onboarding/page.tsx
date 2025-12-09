'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, tenantApi, ApiError } from '@/lib/api';
import { OnboardingWizard } from '@/app/(tenant)/components/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Check both auth.me and onboardingStatus to ensure we catch completion
  const { data: userData, isLoading: isLoadingAuth, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const { data: onboardingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: () => tenantApi.onboardingStatus(),
    retry: false,
  });

  const isLoading = isLoadingAuth || isLoadingStatus;
  const isComplete = userData?.onboarding?.complete || onboardingStatus?.complete;

  // Debug logging
  useEffect(() => {
    console.log('[OnboardingPage] State:', {
      isLoading,
      isLoadingAuth,
      isLoadingStatus,
      hasError: !!error,
      hasUserData: !!userData,
      hasOnboardingStatus: !!onboardingStatus,
      userOnboardingComplete: userData?.onboarding?.complete,
      statusOnboardingComplete: onboardingStatus?.complete,
      isComplete,
    });
  }, [isLoading, isLoadingAuth, isLoadingStatus, error, userData, onboardingStatus, isComplete]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      console.log('[OnboardingPage] Unauthorized, redirecting to login');
      router.push('/login?next=/app/onboarding');
    }
  }, [error, router]);

  // Redirect to /app if onboarding is complete (check both sources)
  useEffect(() => {
    if (!isLoading && isComplete) {
      console.log('[OnboardingPage] Onboarding complete, redirecting to /app');
      // Invalidate and refetch queries to ensure fresh data
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
      void queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
      void queryClient.refetchQueries({ queryKey: ['onboarding', 'status'] });
      
      // Use replace and window.location for immediate redirect
      router.replace('/app');
      setTimeout(() => {
        window.location.href = '/app';
      }, 100);
    }
  }, [isLoading, isComplete, router, queryClient]);

  // If there&apos;s an auth error, show redirect message (redirect will happen via useEffect)
  if (error instanceof ApiError && error.status === 401) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If onboarding is already complete, show redirect message (redirect will happen via useEffect)
  if (!isLoading && userData?.onboarding?.complete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-gray-900">Onboarding Complete!</h1>
          <p className="mt-3 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show wizard - this page bypasses TenantShell for full-screen wizard display
  // Default to first step if no step is specified (new users)
  // The wizard will load its own status and determine the correct step
  const initialStep = userData?.onboarding?.step;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingWizard initialStep={initialStep} />
    </div>
  );
}
