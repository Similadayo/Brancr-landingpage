import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { globalRateLimiter, getEndpointRateLimiter } from '@/lib/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    globalRateLimiter.resetAll();
  });

  describe('globalRateLimiter', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 50; i++) {
        expect(globalRateLimiter.isAllowed('test')).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        globalRateLimiter.isAllowed('test');
      }

      // 101st request should be blocked
      expect(globalRateLimiter.isAllowed('test')).toBe(false);
    });

    it('should calculate remaining requests correctly', () => {
      for (let i = 0; i < 50; i++) {
        globalRateLimiter.isAllowed('test');
      }

      expect(globalRateLimiter.getRemaining('test')).toBe(50);
    });
  });

  describe('getEndpointRateLimiter', () => {
    it('should create endpoint-specific limiter', () => {
      const limiter = getEndpointRateLimiter('/api/tenant/conversations');
      expect(limiter).toBeDefined();
    });

    it('should use stricter limits for conversation endpoints', () => {
      const limiter = getEndpointRateLimiter('/api/tenant/conversations');
      
      // Make 30 requests (the limit for conversations)
      for (let i = 0; i < 30; i++) {
        limiter.isAllowed('/api/tenant/conversations');
      }

      // 31st request should be blocked
      expect(limiter.isAllowed('/api/tenant/conversations')).toBe(false);
    });
  });
});

