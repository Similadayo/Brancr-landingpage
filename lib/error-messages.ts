/**
 * User-friendly error message utility
 * Converts technical API errors into clear, actionable messages for users
 */

export interface ErrorContext {
  action?: string; // What the user was trying to do
  resource?: string; // What resource was involved
  platform?: string; // Which platform (if applicable)
}

/**
 * Get a user-friendly error message from an error
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: ErrorContext
): string {
  // Handle ApiError instances
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as { status?: number; message?: string; body?: { message?: string } };
    const status = apiError.status;
    const message = apiError.body?.message || apiError.message || '';

    // Map HTTP status codes to user-friendly messages
    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return context?.action === 'onboarding'
          ? 'Please complete onboarding to access this feature.'
          : 'You don\'t have permission to perform this action.';
      case 404:
        return context?.resource
          ? `${context.resource} not found. It may have been deleted or moved.`
          : 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with the current state. Please refresh and try again.';
      case 422:
        return message || 'The information you provided is invalid. Please check and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      default:
        return message || 'Something went wrong. Please try again.';
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }

    // Return the error message if it's already user-friendly
    if (error.message && !error.message.includes('Error:') && !error.message.includes('at ')) {
      return error.message;
    }
  }

  // Generic fallback
  const action = context?.action ? ` while ${context.action}` : '';
  return `Something went wrong${action}. Please try again, or contact support if the problem persists.`;
}

/**
 * Get a user-friendly error message for specific actions
 */
export const ErrorMessages = {
  onboarding: {
    industry: 'Failed to save industry selection. Please try again.',
    businessProfile: 'Failed to save business profile. Please check your information and try again.',
    persona: 'Failed to save AI persona settings. Please try again.',
    businessDetails: 'Failed to save business details. Please try again.',
    complete: 'Failed to complete onboarding. Please try again or contact support.',
  },
  media: {
    load: 'Failed to load media. The file may be corrupted or unavailable.',
    upload: 'Failed to upload media. Please check the file and try again.',
    unsupported: 'This media type is not supported.',
  },
  conversation: {
    load: 'Failed to load conversation. Please refresh the page.',
    send: 'Failed to send message. Please check your connection and try again.',
    update: 'Failed to update conversation. Please try again.',
  },
  campaign: {
    create: 'Failed to create post. Please check your content and try again.',
    update: 'Failed to update post. Please try again.',
    delete: 'Failed to delete post. Please try again.',
    publish: 'Failed to publish post. Please check your connection and try again.',
    cancel: 'Failed to cancel post. Please try again.',
  },
  analytics: {
    load: 'Failed to load analytics. Please refresh the page.',
  },
  integration: {
    connect: 'Failed to connect account. Please try again.',
    disconnect: 'Failed to disconnect account. Please try again.',
    verify: 'Failed to verify connection. Please check your account settings.',
  },
  generic: {
    network: 'Unable to connect. Please check your internet connection.',
    server: 'Our servers are experiencing issues. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again or contact support.',
  },
};

