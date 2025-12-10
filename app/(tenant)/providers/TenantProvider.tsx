'use client';

import { createContext, useContext, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiError, authApi } from "@/lib/api";
import { setUserContext, clearUserContext } from "@/lib/observability";

type TenantProfile = {
  tenant_id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  business_name?: string;
  logo_url?: string;
  business_profile?: {
    name?: string;
    logo_url?: string;
  };
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
    isFetching,
    error,
    refetch,
  } = useQuery<TenantProfile, Error>({
    queryKey: ["tenant", "profile"],
    queryFn: async () => authApi.me(),
    retry: (failureCount, err) => {
      // Retry transient server errors a few times before surfacing
      if (err instanceof ApiError && err.status >= 500) {
        return failureCount < 3;
      }
      return false;
    },
    staleTime: 60_000,
  });

  const serverUnavailable = error instanceof ApiError && error.status >= 500;

  // Don't redirect on onboarding page - let it handle its own auth
  if (error instanceof ApiError && error.status === 401 && !isOnboardingPage) {
    router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
  }

  // Set observability user context when tenant is loaded
  useEffect(() => {
    if (data) {
      setUserContext(data.tenant_id, data.email);
    } else {
      clearUserContext();
    }
    return () => {
      clearUserContext();
    };
  }, [data]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: data ?? null,
      loading: serverUnavailable ? true : (isLoading || isFetching),
      error: serverUnavailable
        ? "Service temporarily unavailable. Please try again."
        : error && !(error instanceof ApiError && error.status === 401)
          ? error.message
          : null,
      refresh: () => {
        void refetch();
      },
    }),
    [data, isLoading, isFetching, serverUnavailable, error, refetch]
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

