import { TenantShell } from "../components/TenantShell";
import { TenantProvider } from "../providers/TenantProvider";
import { OnboardingGuard } from "../components/OnboardingGuard";

export default function TenantAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <OnboardingGuard>
        <TenantShell>{children}</TenantShell>
      </OnboardingGuard>
    </TenantProvider>
  );
}

