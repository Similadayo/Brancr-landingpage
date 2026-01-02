'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi, tenantApi, ApiError } from '@/lib/api';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPage = pathname?.startsWith('/app/onboarding');

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

  // Check onboarding status from both sources
  const onboardingComplete = onboardingStatus?.complete === true || userData?.onboarding?.complete === true;

  // Redirect to onboarding if not complete and not already on onboarding page
  useEffect(() => {
    if (!isLoading && !onboardingComplete && !isOnboardingPage && !onboardingServiceUnavailable) {
      router.replace('/app/onboarding');
    }
  }, [isLoading, onboardingComplete, isOnboardingPage, router, onboardingServiceUnavailable]);

  // If we're on the onboarding page, let it handle its own rendering
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // Don't block if there's an auth error (TenantProvider will handle it)
  if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 401) {
    return <>{children}</>;
  }

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (onboardingServiceUnavailable) {
    return <>{children}</>;
  }

  // If onboarding is not complete, show loading (useEffect will redirect)
  if (!onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  // Onboarding is complete, allow access
  return <>{children}</>;
}
