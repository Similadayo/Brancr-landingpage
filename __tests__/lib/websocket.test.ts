import { getWebSocketClient, disconnectWebSocket } from '@/lib/websocket';

describe('WebSocket client helpers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WS_URL = 'wss://example.com/ws';
  });

  afterEach(() => {
    // Clean up any clients
    disconnectWebSocket();
  });

  it('throws when tenantId is missing', () => {
    expect(() => getWebSocketClient(undefined as any)).toThrow('tenantId is required');
  });

  it('creates client with string tenant id in query string', () => {
    const client = getWebSocketClient('tenant_123');
    expect(client.getUrl()).toBe('wss://example.com/ws?tenant_id=tenant_123');
  });

  it('returns same instance for same tenant id', () => {
    const a = getWebSocketClient('tenant_abc');
    const b = getWebSocketClient('tenant_abc');
    expect(a).toBe(b);
  });

  it('disconnectWebSocket removes client', () => {
    const a = getWebSocketClient('tenant_rm');
    disconnectWebSocket('tenant_rm');
    const b = getWebSocketClient('tenant_rm');
    expect(a).not.toBe(b);
  });
});
