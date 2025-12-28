/**
 * User-friendly error message utility
 * Converts technical API errors into clear, actionable messages for users
 */

export interface ErrorContext {
  action?: string; // What the user was trying to do
  resource?: string; // What resource was involved
  platform?: string; // Which platform (if applicable)
  alert_type?: string; // Specific error type from API (e.g., 'whatsapp_template_failure', 'instagram_rate_limit', 'tiktok_upload_failure')
  coming_soon?: boolean; // Whether this is a "coming soon" feature
  feature?: string; // Feature name for "coming soon" messages
}

/**
 * Map error codes/keywords to user-friendly messages
 */
function mapErrorToMessage(errorMessage: string, errorCode: string, context?: ErrorContext): string | null {
  const lowerMessage = errorMessage.toLowerCase();
  const lowerCode = errorCode.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('failed to fetch')) {
    return ErrorMessages.network.noInternet;
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return ErrorMessages.network.timeout;
  }
  if (lowerMessage.includes('unavailable') || lowerMessage.includes('service unavailable')) {
    return ErrorMessages.network.unavailable;
  }
  if (lowerMessage.includes('too many requests') || lowerCode.includes('rate_limit')) {
    return ErrorMessages.network.tooManyRequests;
  }
  if (lowerMessage.includes('connection') && (lowerMessage.includes('lost') || lowerMessage.includes('closed'))) {
    return ErrorMessages.network.connectionLost;
  }

  // Account errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('not authenticated') || lowerCode === 'unauthorized') {
    return ErrorMessages.account.notLoggedIn;
  }
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission denied') || lowerCode === 'forbidden') {
    return ErrorMessages.account.noPermission;
  }
  if (lowerMessage.includes('session expired') || lowerMessage.includes('token expired')) {
    return ErrorMessages.account.sessionExpired;
  }
  if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('wrong password') || lowerMessage.includes('incorrect password')) {
    return ErrorMessages.account.wrongCredentials;
  }
  if (lowerMessage.includes('suspended') || lowerMessage.includes('account suspended')) {
    return ErrorMessages.account.accountSuspended;
  }

  // Not found errors
  if (lowerMessage.includes('not found') || lowerCode === 'not_found') {
    if (context?.resource === 'order') return ErrorMessages.notFound.order;
    if (context?.resource === 'product' || context?.resource === 'service') return ErrorMessages.notFound.product;
    if (context?.resource === 'business profile') return ErrorMessages.notFound.businessProfile;
    return ErrorMessages.notFound.item;
  }

  // Form errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid format')) {
    if (lowerMessage.includes('email')) return ErrorMessages.form.invalidFormat.replace('email address/phone number/URL', 'email address');
    if (lowerMessage.includes('phone')) return ErrorMessages.form.invalidFormat.replace('email address/phone number/URL', 'phone number');
    if (lowerMessage.includes('url')) return ErrorMessages.form.invalidFormat.replace('email address/phone number/URL', 'URL');
    return ErrorMessages.form.invalidFormat;
  }
  if (lowerMessage.includes('required') || lowerMessage.includes('missing')) {
    return ErrorMessages.form.missingFields;
  }
  if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
    return ErrorMessages.form.alreadyExists;
  }

  // Limit errors
  if (lowerMessage.includes('limit') || lowerMessage.includes('quota') || lowerMessage.includes('exceeded')) {
    if (lowerMessage.includes('plan') || lowerMessage.includes('subscription')) {
      return ErrorMessages.limits.usageLimit;
    }
    if (lowerMessage.includes('ai') || lowerMessage.includes('response')) {
      return ErrorMessages.ai.limitReached;
    }
    return ErrorMessages.limits.usageLimit;
  }
  if (lowerMessage.includes('payment required') || lowerMessage.includes('subscription')) {
    return ErrorMessages.limits.paymentRequired;
  }
  if (lowerMessage.includes('feature not available') || lowerMessage.includes('not available on')) {
    return ErrorMessages.limits.featureNotAvailable;
  }

  // Social media errors
  if (lowerMessage.includes('disconnected') || lowerMessage.includes('connection lost')) {
    const platform = context?.platform || 'account';
    if (platform.toLowerCase() === 'instagram') return ErrorMessages.social.instagramDisconnected;
    if (platform.toLowerCase() === 'facebook') return ErrorMessages.social.facebookConnectionFailed;
    return ErrorMessages.social.disconnected(platform);
  }
  if (lowerMessage.includes('social') || lowerMessage.includes('platform')) {
    return ErrorMessages.social.connectionError;
  }

  // Media errors
  if (lowerMessage.includes('file too large') || lowerMessage.includes('size limit')) {
    if (lowerMessage.includes('image')) return ErrorMessages.media.imageTooLarge;
    return ErrorMessages.media.fileTooLarge;
  }
  if (lowerMessage.includes('file type') || lowerMessage.includes('format not supported')) {
    return ErrorMessages.media.wrongFileType;
  }
    if (lowerMessage.includes('upload') && (lowerMessage.includes('failed') || lowerMessage.includes('error'))) {
      if (lowerMessage.includes('image')) return ErrorMessages.media.imageUploadFailed;
      if (lowerMessage.includes('video')) return ErrorMessages.media.videoUploadFailed;
      return ErrorMessages.media.upload;
    }

  // AI errors
  if (lowerMessage.includes('ai') || lowerMessage.includes('assistant')) {
    if (lowerMessage.includes('unavailable')) return ErrorMessages.ai.unavailable;
    if (lowerMessage.includes('limit') || lowerMessage.includes('quota')) return ErrorMessages.ai.limitReached;
    return ErrorMessages.ai.processingFailed;
  }

  // Payment errors
  if (lowerMessage.includes('payment') || lowerMessage.includes('transaction')) {
    if (lowerMessage.includes('failed') || lowerMessage.includes('declined')) return ErrorMessages.payment.failed;
    if (lowerMessage.includes('invalid') || lowerMessage.includes('expired')) return ErrorMessages.payment.invalidMethod;
    if (lowerMessage.includes('subscription expired')) return ErrorMessages.payment.subscriptionExpired;
    return ErrorMessages.payment.failed;
  }

  // Data errors
  if (lowerMessage.includes('save') || lowerMessage.includes('update')) {
    if (lowerMessage.includes('save')) return ErrorMessages.data.saveFailed;
    if (lowerMessage.includes('update')) return ErrorMessages.data.updateFailed;
  }
  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return ErrorMessages.data.deleteFailed;
  }
  if (lowerMessage.includes('load') || lowerMessage.includes('fetch')) {
    return ErrorMessages.data.loadFailed;
  }

  return null;
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
    const apiError = error as { 
      status?: number; 
      message?: string; 
      body?: { 
        message?: string;
        error?: string;
        coming_soon?: boolean;
        feature?: string;
        alert_type?: string;
        [key: string]: unknown;
      } 
    };
    const status = apiError.status;
    const body = apiError.body || {};
    const message = body.message || apiError.message || '';
    const errorCode = body.error || '';
    const alertType = context?.alert_type || body.alert_type || '';

    // Try to map error to friendly message first
    const mappedMessage = mapErrorToMessage(message, errorCode, context);
    if (mappedMessage) return mappedMessage;

    // Check for "coming soon" features
    if (status === 501 || body.coming_soon) {
      const featureName = body.feature || context?.feature || 'This feature';
      return `${featureName} is coming soon. We're working on it!`;
    }

    // Handle platform-specific errors
    if (alertType === 'whatsapp_template_failure' || errorCode === 'whatsapp_template_failure' || message.toLowerCase().includes('template')) {
      return 'Unable to send WhatsApp message. Template may need approval. Please try again later.';
    }

    if (alertType === 'instagram_rate_limit' || errorCode === 'instagram_rate_limit' || (status === 403 && message.toLowerCase().includes('rate limit'))) {
      return 'Instagram rate limit reached. Please wait 5-10 minutes before sending more messages.';
    }

    if (alertType === 'tiktok_upload_failure' || errorCode === 'tiktok_upload_failure' || message.toLowerCase().includes('tiktok upload failed')) {
      return 'TikTok video upload failed. Please check that your video is in a supported format and under the size limit.';
    }

    // Map HTTP status codes to user-friendly messages
    switch (status) {
      case 400:
        // Check for template errors in 400 responses
        if (message.toLowerCase().includes('template') || errorCode.includes('template')) {
          return ErrorMessages.platform.whatsapp_template;
        }
        // Check for validation errors
        if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
          return ErrorMessages.form.hasErrors;
        }
        return message || ErrorMessages.form.hasErrors;
      case 401:
        return ErrorMessages.account.sessionExpired;
      case 403:
        // Check for rate limits in 403 responses
        if (message.toLowerCase().includes('rate limit') || context?.platform === 'instagram') {
          return ErrorMessages.platform.instagram_rate_limit;
        }
        if (context?.action === 'onboarding') {
          return ErrorMessages.limits.setupIncomplete;
        }
        return ErrorMessages.account.noPermission;
      case 404:
        if (context?.resource === 'order') return ErrorMessages.notFound.order;
        if (context?.resource === 'product' || context?.resource === 'service') return ErrorMessages.notFound.product;
        if (context?.resource === 'business profile') return ErrorMessages.notFound.businessProfile;
        if (context?.resource) {
          return `${context.resource} not found. It may have been deleted or moved.`;
        }
        return ErrorMessages.notFound.item;
      case 405:
        return ErrorMessages.limits.actionNotAllowed;
      case 409:
        return ErrorMessages.form.alreadyExists;
      case 422:
        return message || ErrorMessages.form.hasErrors;
      case 429:
        return ErrorMessages.network.tooManyRequests;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorMessages.system.server;
      default:
        return message || ErrorMessages.system.somethingWentWrong;
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Try to map error to friendly message
    const mappedMessage = mapErrorToMessage(error.message, '', context);
    if (mappedMessage) return mappedMessage;

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ErrorMessages.network.noInternet;
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return ErrorMessages.network.timeout;
    }

    // Return the error message if it's already user-friendly (no stack traces)
    if (error.message && !error.message.includes('Error:') && !error.message.includes('at ') && !error.message.includes('TypeError')) {
      return error.message;
    }
  }

  // Generic fallback
  const action = context?.action ? ` while ${context.action}` : '';
  return ErrorMessages.system.somethingWentWrong;
}

/**
 * Parse API field-level errors from an ApiError body and return a field->message map
 */
export function parseApiFieldErrors(error: unknown): Record<string, string> {
  try {
    if (!error || typeof error !== 'object') return {};
    const apiErr = error as { status?: number; body?: any };
    const body = apiErr.body;
    if (!body) return {};

    const map: Record<string, string> = {};

    // Common simple shape: { field: 'name', error: 'message' } or { field: 'name', message: 'message' }
    if (body.field && (body.error || body.message)) {
      map[body.field] = body.error || body.message;
    }

    // shape: { errors: { field: 'msg' } } or { errors: { field: ['msg1','msg2'] } }
    if (body.errors && typeof body.errors === 'object') {
      for (const k of Object.keys(body.errors)) {
        const v = body.errors[k];
        if (Array.isArray(v)) map[k] = v.join(', ');
        else if (typeof v === 'string') map[k] = v;
        else if (v && typeof v === 'object') map[k] = (v.message || JSON.stringify(v));
      }
    }

    // Support validation arrays: { validation: [{ field: 'x', message: 'y' }] }
    if (Array.isArray(body.validation)) {
      for (const item of body.validation) {
        if (item && item.field) map[item.field] = item.message || item.error || JSON.stringify(item);
      }
    }

    // Some APIs embed field errors under body.details or body.error_details
    if (body.details && typeof body.details === 'object') {
      for (const k of Object.keys(body.details)) {
        const v = body.details[k];
        map[k] = typeof v === 'string' ? v : (v?.message || JSON.stringify(v));
      }
    }

    // Log parsing details for observability / debugging
    if (Object.keys(map).length) {
      // Use debug-level log so it doesn't clutter production logs, but is visible during dev/tests
      try {
        console.debug('parseApiFieldErrors: parsed field errors', { status: apiErr.status, parsed: map, body });
      } catch (e) {
        // ignore logging failures
      }
    }

    return map;
  } catch (e) {
    try {
      console.debug('parseApiFieldErrors: failed to parse error', e);
    } catch (e2) {
      // ignore
    }
    return {};
  }
}

/**
 * Comprehensive user-friendly error messages organized by category
 * All messages use plain language that tenants can easily understand
 */
export const ErrorMessages = {
  // Network & Connection Issues
  network: {
    noInternet: "You're not connected to the internet. Check your Wi‑Fi or mobile data.",
    timeout: "This is taking longer than usual. Please try again.",
    unavailable: "The website is temporarily unavailable. Please try again in a few minutes.",
    tooManyRequests: "Too many requests right now. Please wait a moment and try again.",
    connectionLost: "Lost connection to the server. Please check your internet and try again.",
    generic: "Check your internet connection and try again.",
    troubleConnecting: "We're having trouble connecting. Please wait a moment and try again.",
  },

  // Login & Account Issues
  account: {
    notLoggedIn: "Please log in to continue.",
    noPermission: "You don't have permission to view this.",
    sessionExpired: "Your session expired. Please log in again.",
    wrongCredentials: "The email or password is incorrect. Please try again.",
    accountSuspended: "Your account is suspended. Please contact support for help.",
  },

  // Missing Items
  notFound: {
    page: "This page doesn't exist.",
    item: "We couldn't find what you're looking for.",
    businessProfile: "Your business profile isn't set up yet.",
    order: "We couldn't find this order.",
    product: "This product or service isn't available right now.",
    generic: "The requested resource was not found.",
  },

  // Form Errors
  form: {
    hasErrors: "Please fix the errors in your form before submitting.",
    missingFields: "Please fill in all required fields.",
    invalidFormat: "Please enter a valid email address/phone number/URL.",
    alreadyExists: "This already exists. Please use a different name.",
    uploadFailed: "Couldn't upload your file. Please check the file and try again.",
  },

  // Business Limits & Restrictions
  limits: {
    usageLimit: "You've reached your plan limit. Upgrade to continue.",
    paymentRequired: "Payment is required to continue. Please add a payment method.",
    setupIncomplete: "Please complete your setup before using this feature.",
    featureNotAvailable: "This feature isn't available on your current plan. Upgrade to access it.",
    actionNotAllowed: "This action isn't allowed right now. Please check your settings.",
    higherPlan: "This feature is only available on higher plans.",
  },

  // Data Issues
  data: {
    noData: "You don't have any items yet. Create your first one!",
    loadFailed: "We couldn't load your data. Please refresh the page.",
    saveFailed: "We couldn't save your changes. Please try again.",
    deleteFailed: "We couldn't delete this item. Please try again.",
    updateFailed: "We couldn't update this. Please try again.",
    noOrders: "No orders yet. When customers place orders, they'll appear here.",
    noProducts: "We couldn't load your products. Pull down to refresh.",
  },

  // Social Media Connection Issues
  social: {
    disconnected: (platform: string = 'account') => `Your ${platform} account is disconnected. Reconnect it in settings.`,
    loginFailed: "Couldn't log in to your social account. Please try again.",
    connectionError: "There was a problem with your social media account. Please check your connection.",
    verificationFailed: "Couldn't verify your connection. Please reconnect your account.",
    instagramDisconnected: "Your Instagram is disconnected. Reconnect it in Settings → Integrations.",
    facebookConnectionFailed: "Couldn't connect to Facebook. Please check your login and try again.",
  },

  // File & Media Issues
  media: {
    imageUploadFailed: "Couldn't upload your image. Please check the file and try again.",
    videoUploadFailed: "Couldn't upload your video. The file may be too large or in the wrong format.",
    fileTooLarge: "Your file is too large. Please use a smaller file.",
    imageTooLarge: "Your image is too large. Please use an image smaller than 10MB.",
    wrongFileType: "This file type isn't supported. Please use JPG, PNG, or MP4.",
    unsupportedType: "This file type isn't supported. Please use JPG, PNG, or MP4 files.",
    processingFailed: "We couldn't process your media. Please try uploading again.",
    load: 'Failed to load media. The file may be corrupted or unavailable.',
    upload: 'Failed to upload media. Please check the file and try again.',
    unsupported: 'This media type is not supported.',
  },

  // AI Assistant Issues
  ai: {
    unavailable: "The AI assistant is temporarily unavailable. Please try again later.",
    processingFailed: "The AI couldn't process your request. Please try again.",
    limitReached: "You've used all your AI responses for today. They'll reset tomorrow.",
    autoReplyOff: "Auto-reply is turned off. Turn it on in settings to use this feature.",
    trouble: "The AI assistant is having trouble right now. Please try again in a moment.",
  },

  // Payment Issues
  payment: {
    failed: "Your payment couldn't be processed. Please check your payment method and try again.",
    invalidMethod: "Your payment method is invalid. Please update your card or bank details.",
    subscriptionExpired: "Your subscription has expired. Please renew to continue using the service.",
    invoiceError: "We couldn't create your invoice. Please contact support.",
    cardDetails: "Your payment couldn't be processed. Please check your card details.",
    renew: "Your subscription has expired. Renew now to continue.",
  },

  // Messaging Issues
  messaging: {
    connectionLost: "Lost connection to live updates. Refreshing...",
    sendFailed: "We couldn't send your message. Please try again.",
    notificationFailed: "We couldn't send your notification. Please check your settings.",
  },

  // System Issues
  system: {
    somethingWentWrong: "Something unexpected happened. Please try again or contact support if it continues.",
    dataError: "We couldn't save your information. Please try again.",
    settingsError: "There's a problem with your settings. Please contact support.",
    maintenance: "We're doing scheduled maintenance. We'll be back soon!",
    server: 'Our servers are experiencing issues. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again or contact support.',
  },

  // Legacy categories (keeping for backward compatibility)
  onboarding: {
    industry: 'Failed to save industry selection. Please try again.',
    businessProfile: 'Failed to save business profile. Please check your information and try again.',
    persona: 'Failed to save AI persona settings. Please try again.',
    businessDetails: 'Failed to save business details. Please try again.',
    complete: 'Failed to complete onboarding. Please try again or contact support.',
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
  platform: {
    whatsapp_template: 'WhatsApp template error. Template may need approval. Please try again later.',
    instagram_rate_limit: 'Instagram rate limit reached. Please wait 5-10 minutes before sending more messages.',
    tiktok_upload: 'TikTok video upload failed. Please check video format and size limit.',
  },
  generic: {
    network: 'Unable to connect. Please check your internet connection.',
    server: 'Our servers are experiencing issues. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again or contact support.',
  },
};

/**
 * Get error message by category and key
 * Example: getErrorMessage('network', 'noInternet')
 */
export function getErrorMessage(category: keyof typeof ErrorMessages, key: string): string {
  const categoryMessages = ErrorMessages[category];
  if (!categoryMessages || typeof categoryMessages !== 'object') {
    return ErrorMessages.system.unknown;
  }
  
  const message = (categoryMessages as Record<string, string | ((...args: any[]) => string)>)[key];
  if (typeof message === 'function') {
    return message();
  }
  if (typeof message === 'string') {
    return message;
  }
  
  return ErrorMessages.system.unknown;
}

/**
 * Get error message for a specific error type
 * This is a convenience function that tries to match common error patterns
 */
export function getErrorByPattern(errorMessage: string, context?: ErrorContext): string | null {
  return mapErrorToMessage(errorMessage, '', context);
}

