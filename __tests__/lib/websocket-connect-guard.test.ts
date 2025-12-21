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

    // give the fake socket time to run its open
    await new Promise((r) => setTimeout(r, 20));

    expect(constructCount).toBe(1);

    client.disconnect();
  });
});

