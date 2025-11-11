'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTenant } from "../providers/TenantProvider";
import { ApiError, authApi } from "@/lib/api";

export function useRequireTenant() {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, loading, error, refresh } = useTenant();

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (loading || tenant) return;
      try {
        await authApi.me();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
        }
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [tenant, loading, router, pathname]);

  return { tenant, loading, error, refresh };
}

