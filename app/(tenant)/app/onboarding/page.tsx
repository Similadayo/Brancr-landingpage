'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi, ApiError } from '@/lib/api';
import { OnboardingWizard } from '@/app/(tenant)/components/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.push('/login?next=/app/onboarding');
    }
  }, [error, router]);

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (userData?.onboarding?.complete) {
      router.push('/app');
    }
  }, [userData?.onboarding?.complete, router]);

  // If there's an auth error, show redirect message (redirect will happen via useEffect)
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
          <p className="mt-3 text-sm text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show wizard - this page bypasses TenantShell for full-screen wizard display
  // Default to first step if no step is specified (new users)
  // Show wizard even if loading or userData is undefined (will show first step)
  const initialStep = userData?.onboarding?.step || 'business_profile';
  
  // Show loading state OR wizard
  if (isLoading && !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingWizard initialStep={initialStep} />
    </div>
  );
}
