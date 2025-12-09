/**
 * Hook for request cancellation on component unmount
 */

import { useEffect, useRef } from 'react';

export function useRequestCancellation() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create abort controller on mount
    abortControllerRef.current = new AbortController();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    signal: abortControllerRef.current?.signal,
    abort: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
      }
    },
  };
}

