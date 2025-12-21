/**
 * WebSocket client for real-time updates
 * Reduces polling overhead
 */

type WebSocketMessage = {
  type: string;
  payload: unknown;
  tenant_id?: number;
};

type WebSocketCallbacks = {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs = 30000; // 30 seconds

  constructor(url: string) {
    this.url = url;
  }

  connect(callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.callbacks.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error event', error);
        this.callbacks.onError?.(error);
      };

      this.ws.onclose = (event) => {
        // Provide richer diagnostics: close code, reason and wasClean
        try {
          console.error('WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        } catch (e) {
          console.error('WebSocket closed (unable to read event details)', e);
        }
        this.stopHeartbeat();
        this.callbacks.onClose?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.warn(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    // Clear any existing timer first
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectTimer = setTimeout(() => {
      // Always attempt to create a fresh connection regardless of previous readyState
      try {
        this.connect(this.callbacks);
      } catch (err) {
        console.error('Reconnect attempt failed to create socket:', err);
        // Schedule another reconnect attempt
        this.attemptReconnect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent.');
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Keep a per-tenant map of websocket clients so different tenants don't reuse the same connection
const wsClientsByTenant = new Map<number, WebSocketClient>();

export function getWebSocketClient(tenantId: number): WebSocketClient {
  const existing = wsClientsByTenant.get(tenantId);
  if (existing) return existing;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.brancr.com/ws';
  const client = new WebSocketClient(`${wsUrl}?tenant_id=${tenantId}`);
  wsClientsByTenant.set(tenantId, client);
  return client;
}

export function disconnectWebSocket(tenantId?: number) {
  if (typeof tenantId === 'number') {
    const c = wsClientsByTenant.get(tenantId);
    if (c) {
      c.disconnect();
      wsClientsByTenant.delete(tenantId);
    }
  } else {
    // Disconnect all
    for (const [id, client] of wsClientsByTenant.entries()) {
      client.disconnect();
      wsClientsByTenant.delete(id);
    }
  }
}

