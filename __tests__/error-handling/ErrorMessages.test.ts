/**
 * Error message utility tests
 * Verifies that error messages are user-friendly and contextual
 */

import { getUserFriendlyErrorMessage, ErrorMessages } from '@/lib/error-messages';
import { ApiError } from '@/lib/api';

describe('Error Messages', () => {
  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for 401 errors', () => {
      const error = new ApiError('Unauthorized', 401);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('session has expired');
    });

    it('should return user-friendly message for 403 errors with onboarding context', () => {
      const error = new ApiError('Forbidden', 403);
      const message = getUserFriendlyErrorMessage(error, { action: 'onboarding' });
      expect(message).toContain('complete onboarding');
    });

    it('should return user-friendly message for 404 errors with resource context', () => {
      const error = new ApiError('Not Found', 404);
      const message = getUserFriendlyErrorMessage(error, { resource: 'post' });
      expect(message).toContain('post not found');
    });

    it('should return user-friendly message for 429 errors', () => {
      const error = new ApiError('Too Many Requests', 429);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('Too many requests');
    });

    it('should return user-friendly message for 500 errors', () => {
      const error = new ApiError('Internal Server Error', 500);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('servers are experiencing issues');
    });

    it('should return user-friendly message for network errors', () => {
      const error = new Error('Network request failed');
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('internet connection');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Error: Unknown error at line 123');
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('Something went wrong');
    });
  });

  describe('ErrorMessages constants', () => {
    it('should have messages for all error categories', () => {
      expect(ErrorMessages.onboarding).toBeDefined();
      expect(ErrorMessages.media).toBeDefined();
      expect(ErrorMessages.conversation).toBeDefined();
      expect(ErrorMessages.campaign).toBeDefined();
      expect(ErrorMessages.analytics).toBeDefined();
      expect(ErrorMessages.integration).toBeDefined();
      expect(ErrorMessages.generic).toBeDefined();
    });
  });
});

