/**
 * Custom observability system for error tracking and monitoring
 * Replaces Sentry with a self-hosted solution
 */

type ErrorContext = {
  tenant_id?: number;
  user_id?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: unknown;
};

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type QueueItem = {
  type: string;
  payload: unknown;
};

class ObservabilityClient {
  private endpoint: string;
  private enabled: boolean;
  private queue: QueueItem[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_OBSERVABILITY_ENDPOINT || '/api/observability';
    this.enabled = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_OBSERVABILITY === 'true';
    
    // Flush queue every 5 seconds
    if (typeof window !== 'undefined' && this.enabled) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  private async send(data: QueueItem) {
    if (!this.enabled) {
      console.log('[Observability]', data.type, data.payload);
      return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true, // Ensure request completes even if page unloads
      });
    } catch (error) {
      console.error('[Observability] Failed to send:', error);
      // Queue for retry
      this.queue.push(data);
    }
  }

  private flush() {
    if (this.queue.length === 0) return;

    const items = [...this.queue];
    this.queue = [];

    items.forEach((item) => {
      this.send(item).catch(() => {
        // Re-queue on failure
        this.queue.push(item);
      });
    });
  }

  captureException(error: Error, context?: ErrorContext) {
    const errorData = {
      type: 'error',
      payload: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      },
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error]', error, context);
    }

    this.send(errorData);
  }

  captureMessage(message: string, level: LogLevel = 'info', context?: ErrorContext) {
    const messageData = {
      type: 'log',
      payload: {
        message,
        level,
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    if (process.env.NODE_ENV === 'development') {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[Observability]', message, context);
    }

    if (level === 'error' || level === 'warn') {
      this.send(messageData);
    }
  }

  setUser(tenantId: number, email?: string) {
    if (typeof window !== 'undefined') {
      (window as { __observability_user?: { tenantId: number; email?: string } }).__observability_user = {
        tenantId,
        email,
      };
    }
  }

  clearUser() {
    if (typeof window !== 'undefined') {
      delete (window as { __observability_user?: unknown }).__observability_user;
    }
  }

  trackEvent(eventName: string, properties?: Record<string, unknown>) {
    this.send({
      type: 'event',
      payload: {
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Flush remaining items
  }
}

// Global instance
export const observability = new ObservabilityClient();

// Helper functions matching Sentry API for easy migration
export function captureException(error: Error, context?: ErrorContext) {
  observability.captureException(error, context);
}

export function captureMessage(message: string, level: LogLevel = 'info', context?: ErrorContext) {
  observability.captureMessage(message, level, context);
}

export function setUserContext(tenantId: number, email?: string) {
  observability.setUser(tenantId, email);
}

export function clearUserContext() {
  observability.clearUser();
}

// Initialize global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    observability.captureException(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    observability.captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  });

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    observability.destroy();
  });
}

