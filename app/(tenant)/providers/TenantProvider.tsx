'use client';

import { createContext, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError, authApi } from "@/lib/api";

type TenantProfile = {
  tenant_id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  onboarding?: {
    complete: boolean;
    step?: 'business_profile' | 'persona' | 'business_details' | 'social_connect';
  };
};

type TenantContextValue = {
  tenant: TenantProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnboardingPage = pathname === '/app/onboarding';

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TenantProfile, Error>({
    queryKey: ["tenant", "profile"],
    queryFn: async () => authApi.me(),
    retry: false,
  });

  // Don't redirect on onboarding page - let it handle its own auth
  if (error instanceof ApiError && error.status === 401 && !isOnboardingPage) {
    router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
  }

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: data ?? null,
      loading: isLoading,
      error: error && !(error instanceof ApiError && error.status === 401) ? error.message : null,
      refresh: () => {
        void refetch();
      },
    }),
    [data, isLoading, error, refetch]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}

