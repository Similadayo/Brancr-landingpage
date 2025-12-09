/**
 * Enhanced API client with retry logic, rate limiting, deduplication, and CSRF protection
 */

import { globalRateLimiter, getEndpointRateLimiter } from './rate-limiter';
import { requestDeduplicator, generateRequestKey } from './request-deduplication';
import { captureException } from './sentry';

const DEFAULT_API_BASE_URL = "https://api.brancr.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

type ApiErrorBody = {
  error?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;
  retryable: boolean;

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    // Determine if error is retryable
    this.retryable = status >= 500 || status === 429 || status === 408;
  }
}

type ApiRequestOptions = RequestInit & {
  parseJson?: boolean;
  retries?: number;
  retryDelay?: number;
  enableDeduplication?: boolean;
  enableRateLimit?: boolean;
  skipCSRF?: boolean;
};

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Get CSRF token from cookie or meta tag
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;

  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Fallback to cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }

  return null;
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

function buildHeaders(initHeaders?: HeadersInit, body?: BodyInit | null, skipCSRF = false): HeadersInit {
  const defaultHeaders: HeadersInit = {};

  if (body instanceof FormData) {
    // Let the browser set the multipart/form-data headers
    return initHeaders ?? defaultHeaders;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...defaultHeaders,
    ...initHeaders,
  };

  // Add CSRF token if available and not skipped
  if (!skipCSRF && typeof window !== 'undefined') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const message = body?.error || response.statusText || "Request failed";
  return new ApiError(message, response.status, body);
}

/**
 * Enhanced API fetch with retry logic, rate limiting, and deduplication
 */
export async function apiFetch<TResponse = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const {
    parseJson = true,
    headers,
    body,
    retries = defaultRetryConfig.maxRetries,
    retryDelay = defaultRetryConfig.initialDelay,
    enableDeduplication = true,
    enableRateLimit = true,
    skipCSRF = false,
    ...rest
  } = options;

  const method = (rest.method || 'GET').toUpperCase();
  const url = buildUrl(path);

  // Generate request key for deduplication
  // Convert body to string for key generation (only for JSON bodies)
  const bodyForKey = body instanceof FormData 
    ? 'form-data' 
    : body 
    ? (typeof body === 'string' ? body : JSON.stringify(body))
    : undefined;
  const requestKey = generateRequestKey(method, path, bodyForKey);

  // Rate limiting check
  if (enableRateLimit && typeof window !== 'undefined') {
    const endpointLimiter = getEndpointRateLimiter(path);
    if (!endpointLimiter.isAllowed(path)) {
      const retryAfter = endpointLimiter.getRetryAfter(path);
      throw new ApiError(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        429,
        { retryAfter }
      );
    }

    // Also check global rate limiter
    if (!globalRateLimiter.isAllowed('global')) {
      const retryAfter = globalRateLimiter.getRetryAfter('global');
      throw new ApiError(
        `Too many requests. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        429,
        { retryAfter }
      );
    }
  }

  // Request function
  const makeRequest = async (attempt = 0): Promise<TResponse> => {
    try {
      const response = await fetch(url, {
        credentials: "include",
        ...rest,
        method,
        headers: buildHeaders(headers, body ?? null, skipCSRF),
        body,
      });

      // Handle rate limiting from server
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : calculateBackoffDelay(attempt, defaultRetryConfig);
        throw new ApiError('Rate limited by server', 429, { retryAfter: delay });
      }

      if (!response.ok) {
        const error = await parseError(response);
        
        // Retry on retryable errors
        if (error.retryable && attempt < retries) {
          const delay = calculateBackoffDelay(attempt, defaultRetryConfig);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return makeRequest(attempt + 1);
        }

        throw error;
      }

      if (!parseJson || response.status === 204) {
        return undefined as TResponse;
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const apiError = new ApiError('Network error. Please check your connection.', 0, null);
        
        // Retry on network errors
        if (attempt < retries) {
          const delay = calculateBackoffDelay(attempt, defaultRetryConfig);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return makeRequest(attempt + 1);
        }

        // Log to Sentry
        captureException(error as Error, { path, method, attempt });
        throw apiError;
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        // Log to Sentry if not retryable or max retries reached
        if (!error.retryable || attempt >= retries) {
          captureException(error, { path, method, attempt, status: error.status });
        }
        throw error;
      }

      // Unknown error
      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        null
      );
      captureException(error as Error, { path, method, attempt });
      throw apiError;
    }
  };

  // Apply deduplication if enabled
  if (enableDeduplication && typeof window !== 'undefined') {
    return requestDeduplicator.deduplicate(requestKey, makeRequest);
  }

  return makeRequest();
}

// Convenience helpers for common HTTP verbs
export function get<TResponse = unknown>(path: string, options?: ApiRequestOptions) {
  return apiFetch<TResponse>(path, { method: "GET", ...options });
}

export function post<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function patch<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function put<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function del<TResponse = unknown>(path: string, options?: ApiRequestOptions) {
  return apiFetch<TResponse>(path, { method: "DELETE", ...options });
}

