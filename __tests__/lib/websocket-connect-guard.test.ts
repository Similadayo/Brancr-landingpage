/// <reference types="jest" />


/* eslint-env jest */

describe('WebSocket connect guard', () => {
  let OriginalWebSocket: any;

  beforeAll(() => {
    OriginalWebSocket = (global as any).WebSocket;
  });

  afterAll(() => {
    (global as any).WebSocket = OriginalWebSocket;
  });

  it('does not create duplicate sockets when already connecting/open', async () => {
    let constructCount = 0;
    // Fake WebSocket class
    class FakeWS {
      readyState: number = 0; // CONNECTING
      onopen: (() => void) | null = null;
      onclose: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onmessage: ((e: any) => void) | null = null;
      constructor(url: string) {
        constructCount++;
        // simulate open after a short delay
        setTimeout(() => {
          this.readyState = 1; // OPEN
          this.onopen && this.onopen();
        }, 5);
      }
      send() {}
      close() {
        this.readyState = 3;
        this.onclose && this.onclose({ code: 1000, reason: 'closed', wasClean: true });
      }
    }

    (global as any).WebSocket = FakeWS;

    const { getWebSocketClient } = await import('@/lib/websocket');

    const client = getWebSocketClient('guard-test');

    // call connect twice synchronously
    client.connect();
    client.connect();

    // Immediately call disconnect while socket is CONNECTING
    client.disconnect();

    // internal ws should still exist (we do not null it out when CONNECTING)
    const internalWs = (client as any).ws as any;
    expect(internalWs).toBeDefined();

    // The fake socket should not have been closed immediately
    // (close will be called later by onopen handler if manualDisconnect was set)
    await new Promise((r) => setTimeout(r, 10));

    // Now simulate the underlying socket opening (this will trigger onopen, which should detect manualDisconnect and close politely)
    internalWs.onopen();

    // Wait a tick to allow onopen-triggered close to execute
    await new Promise((r) => setTimeout(r, 10));

    // At this point the fake's close should have been called (one close)
    // and no new constructor calls should have occurred
    expect(constructCount).toBe(1);

    client.disconnect();
  });
});

