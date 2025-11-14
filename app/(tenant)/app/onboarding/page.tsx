'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { OnboardingWizard } from '@/app/(tenant)/components/OnboardingWizard';

export default function OnboardingPage() {
  const { data: userData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // If onboarding is already complete, redirect to dashboard
  if (userData?.onboarding?.complete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-gray-900">Onboarding Complete!</h1>
          <p className="mt-3 text-sm text-gray-600">You've already completed onboarding.</p>
          <a
            href="/app"
            className="mt-6 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <OnboardingWizard initialStep={userData?.onboarding?.step} />;
}
