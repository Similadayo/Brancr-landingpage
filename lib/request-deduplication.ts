/**
 * Request deduplication to prevent duplicate API calls
 */

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly TTL = 5000; // 5 seconds

  /**
   * Deduplicate a request by key
   * @param key - Unique key for the request (e.g., method + path + params)
   * @param requestFn - Function that makes the actual request
   * @returns Promise that resolves to the request result
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);

    if (pending) {
      // Check if it's still valid (not expired)
      const age = Date.now() - pending.timestamp;
      if (age < this.TTL) {
        // Return the existing promise
        return pending.promise as Promise<T>;
      } else {
        // Remove expired request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, this.TTL);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Generate a unique key for a request
   */
  static generateKey(
    method: string,
    path: string,
    params?: Record<string, unknown> | string
  ): string {
    const paramStr =
      typeof params === 'string'
        ? params
        : params
        ? JSON.stringify(params)
        : '';
    return `${method}:${path}:${paramStr}`;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear expired requests
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp >= this.TTL) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Global deduplicator instance
export const requestDeduplicator = new RequestDeduplicator();

// Export the class for static methods
export { RequestDeduplicator };

// Helper function to generate request keys
export function generateRequestKey(
  method: string,
  path: string,
  params?: Record<string, unknown> | string
): string {
  return RequestDeduplicator.generateKey(method, path, params);
}

// Cleanup expired requests every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 60000);
}

