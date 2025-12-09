'use client';

import { usePathname } from 'next/navigation';
import { TenantShell } from "../components/TenantShell";
import { TenantProvider } from "../providers/TenantProvider";
import { OnboardingGuard } from "../components/OnboardingGuard";
import { ErrorBoundary } from "@/lib/error-boundary";

export default function TenantAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === '/app/onboarding';

  return (
    <ErrorBoundary>
      <TenantProvider>
        <OnboardingGuard>
          {isOnboardingPage ? (
            // Onboarding page renders without shell for full-screen wizard
            children
          ) : (
            // Other pages render with shell
            <TenantShell>{children}</TenantShell>
          )}
        </OnboardingGuard>
      </TenantProvider>
    </ErrorBoundary>
  );
}

