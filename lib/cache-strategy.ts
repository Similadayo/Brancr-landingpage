/**
 * Caching strategy for API responses
 */

import { QueryClient } from '@tanstack/react-query';

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data (conversations, messages)
  SHORT: 10_000, // 10 seconds

  // Medium-lived data (analytics, stats)
  MEDIUM: 60_000, // 1 minute

  // Long-lived data (settings, profile)
  LONG: 300_000, // 5 minutes

  // Very long-lived data (static content)
  VERY_LONG: 3_600_000, // 1 hour
};

/**
 * Configure React Query with optimal cache settings
 */
export function configureQueryClientCache(queryClient: QueryClient) {
  // Set default stale time
  queryClient.setDefaultOptions({
    queries: {
      staleTime: CACHE_TIMES.MEDIUM,
      gcTime: CACHE_TIMES.LONG, // Previously cacheTime
    },
  });
}

/**
 * Get cache key for a query
 */
export function getCacheKey(prefix: string, params?: Record<string, unknown>): unknown[] {
  if (!params) {
    return [prefix];
  }
  return [prefix, params];
}

/**
 * Invalidate related cache entries
 */
export function invalidateRelatedQueries(
  queryClient: QueryClient,
  prefixes: string[]
) {
  prefixes.forEach((prefix) => {
    queryClient.invalidateQueries({ queryKey: [prefix] });
  });
}

