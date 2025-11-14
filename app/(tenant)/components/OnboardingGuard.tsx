'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi, ApiError } from '@/lib/api';
import { OnboardingWizard } from './OnboardingWizard';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === '/app/onboarding';

  // Always call hooks at the top level (React Hooks rules)
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  // If we're on the onboarding page, let it handle its own rendering
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // Don't block if there's an auth error (TenantProvider will handle it)
  if (error instanceof ApiError && error.status === 401) {
    return <>{children}</>;
  }

  const onboardingComplete = userData?.onboarding?.complete ?? false;
  const currentStep = userData?.onboarding?.step;

  // If onboarding is not complete, show wizard as overlay blocking other pages
  if (!isLoading && !onboardingComplete) {
    return (
      <>
        <OnboardingWizard initialStep={currentStep} />
        {/* Render children behind the modal so layout doesn't break */}
        <div className="opacity-0 pointer-events-none">{children}</div>
      </>
    );
  }

  return <>{children}</>;
}

