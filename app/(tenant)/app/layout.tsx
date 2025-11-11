import { TenantShell } from "../components/TenantShell";
import { TenantProvider } from "../providers/TenantProvider";

export default function TenantAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <TenantShell>{children}</TenantShell>
    </TenantProvider>
  );
}

