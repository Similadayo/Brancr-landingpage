'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { OnboardingWizard } from './OnboardingWizard';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === '/app/onboarding';

  const { data: userData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const onboardingComplete = userData?.onboarding?.complete ?? false;
  const currentStep = userData?.onboarding?.step;

  // If onboarding is not complete and not on onboarding page, show wizard overlay
  if (!isLoading && !onboardingComplete && !isOnboardingPage) {
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

