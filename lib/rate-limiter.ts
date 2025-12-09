/**
 * Client-side rate limiter to prevent excessive API calls
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Check if a request is allowed
   * @param key - Unique identifier for the rate limit (e.g., endpoint path)
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request history for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the window
    requestTimes = requestTimes.filter((time) => time > windowStart);

    // Check if we've exceeded the limit
    if (requestTimes.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return true;
  }

  /**
   * Get remaining requests in the current window
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requestTimes = this.requests.get(key) || [];
    const recentRequests = requestTimes.filter((time) => time > windowStart);
    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  getRetryAfter(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requestTimes = this.requests.get(key) || [];
    const recentRequests = requestTimes.filter((time) => time > windowStart);

    if (recentRequests.length < this.config.maxRequests) {
      return 0;
    }

    // Return time until oldest request expires
    const oldestRequest = Math.min(...recentRequests);
    return oldestRequest + this.config.windowMs - now;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per minute
});

// Per-endpoint rate limiters
export const endpointRateLimiters = new Map<string, RateLimiter>();

export function getEndpointRateLimiter(endpoint: string): RateLimiter {
  if (!endpointRateLimiters.has(endpoint)) {
    // Stricter limits for specific endpoints
    const config: RateLimitConfig = {
      maxRequests: endpoint.includes('/conversations') ? 30 : 50,
      windowMs: 60000,
    };
    endpointRateLimiters.set(endpoint, new RateLimiter(config));
  }
  return endpointRateLimiters.get(endpoint)!;
}

