/**
 * Tenant-aware WebSocket hook
 * Use this version when you have access to useTenant hook
 */

import { useWebSocket as useWebSocketBase } from './use-websocket';
import { useTenant } from '@/app/(tenant)/providers/TenantProvider';

type WebSocketMessage = {
  type: string;
  payload: unknown;
};

/**
 * WebSocket hook that automatically gets tenant ID from context
 * Use this within tenant app components
 */
export function useWebSocketTenant(
  onMessage?: (message: WebSocketMessage) => void
) {
  const { tenant } = useTenant();
  return useWebSocketBase(onMessage, tenant?.tenant_id);
}

