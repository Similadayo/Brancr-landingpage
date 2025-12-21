/**
 * React hook for WebSocket connections
 */

import { useEffect, useRef, useState } from 'react';
import { getWebSocketClient, disconnectWebSocket } from '../websocket';

type WebSocketMessage = {
  type: string;
  payload: unknown;
};

type TenantProvider = {
  tenant: { tenant_id: number } | null;
};

/**
 * Hook for WebSocket connections
 * @param onMessage - Callback for incoming messages
 * @param tenantId - Tenant ID (required). Use useWebSocketTenant for automatic tenant ID from context.
 */
export function useWebSocket(
  onMessage: ((message: WebSocketMessage) => void) | undefined,
  tenantId: number | undefined
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsClientRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const resolvedTenantIdRef = useRef<number | null>(null);

  // Try to get tenant ID from context if not provided
  useEffect(() => {
    if (tenantId) {
      resolvedTenantIdRef.current = tenantId;
      return;
    }

    // Try to import and use tenant provider dynamically
    // This is safe because we're in useEffect, not during render
    try {
      // Dynamic import to avoid circular dependencies
      import('@/app/(tenant)/providers/TenantProvider').then((module) => {
        // This won't work in useEffect, so we need a different approach
        // Instead, we'll require tenantId to be passed
      });
    } catch {
      // Tenant provider not available
    }
  }, [tenantId]);

  useEffect(() => {
    const id = tenantId || resolvedTenantIdRef.current;
    if (!id) {
      return;
    }

    const client = getWebSocketClient(id);
    wsClientRef.current = client;

    let toastId: string | undefined;
    client.connect({
      onOpen: () => {
        setIsConnected(true);
        if (toastId) {
          import('react-hot-toast').then((mod) => mod.toast.dismiss(toastId));
        }
      },
      onMessage: (message) => {
        onMessage?.(message);
      },
      onError: (error) => {
        // Show toast and log to observability
        import('react-hot-toast').then(({ toast }) => {
          toastId = toast.error('Real-time updates unavailable. Some features may be delayed.', { id: 'ws-fail', duration: 8000 });
        });
        import('../observability').then(({ captureException }) => {
          captureException(new Error('WebSocket error'), { error, tenant_id: id, action: 'websocket_connect' });
        });
        setIsConnected(false);
      },
      onClose: () => {
        setIsConnected(false);
      },
    });

    return () => {
      client.disconnect();
      if (toastId) {
        import('react-hot-toast').then((mod) => mod.toast.dismiss(toastId));
      }
    };
  }, [tenantId, onMessage]);

  const send = (message: WebSocketMessage) => {
    wsClientRef.current?.send(message);
  };

  return {
    isConnected,
    send,
  };
}

