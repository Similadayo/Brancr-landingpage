const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

let Sentry: typeof import('@sentry/nextjs') | null = null;

// Lazy load Sentry
function getSentry() {
  if (!Sentry && typeof window !== 'undefined' && SENTRY_DSN) {
    try {
      Sentry = require('@sentry/nextjs');
    } catch {
      // Sentry not installed
    }
  }
  return Sentry;
}

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  const SentryInstance = getSentry();
  if (!SentryInstance) {
    console.warn('Sentry not installed. Error tracking disabled.');
    return;
  }

  SentryInstance.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    debug: ENVIRONMENT === 'development',
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignore network errors that are handled gracefully
          if (error.message.includes('fetch') && error.message.includes('Failed to fetch')) {
            return null;
          }
        }
      }
      return event;
    },
    integrations: [
      SentryInstance.browserTracingIntegration(),
      SentryInstance.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  const SentryInstance = getSentry();
  if (SentryInstance) {
    SentryInstance.captureException(error, {
      extra: context,
    });
  }
}

export function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info') {
  const SentryInstance = getSentry();
  if (SentryInstance) {
    SentryInstance.captureMessage(message, level);
  }
}

export function setUserContext(tenantId: number, email: string) {
  const SentryInstance = getSentry();
  if (SentryInstance) {
    SentryInstance.setUser({
      id: tenantId.toString(),
      email,
    });
  }
}

export function clearUserContext() {
  const SentryInstance = getSentry();
  if (SentryInstance) {
    SentryInstance.setUser(null);
  }
}

