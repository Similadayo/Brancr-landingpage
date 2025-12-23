// Polyfill minimal Request for Next's server modules during tests
// Next's server code expects a global Request to exist at import-time
if (!(global as any).Request) {
  (global as any).Request = class Request {
    constructor() {}
  };
}
if (!(global as any).Response) {
  (global as any).Response = class Response {
    status: number;
    _body: any;
    constructor(body: any, init: any = {}) { this._body = body; this.status = init.status || 200; }
    static json(body: any, init: any = {}) { return new Response(body, init); }
    async json() { return this._body; }
    text() { return JSON.stringify(this._body); }
  };
}
if (!(global as any).Headers) {
  (global as any).Headers = class Headers {
    private map: Map<string,string> = new Map();
    constructor(init?: any) { if (init) Object.keys(init).forEach(k => this.map.set(k.toLowerCase(), String(init[k]))); }
    get(k: string) { return this.map.get(k.toLowerCase()) ?? null; }
    set(k: string, v: string) { this.map.set(k.toLowerCase(), v); }
  };
}

let POST: any;
beforeAll(async () => {
  const mod = await import('@/app/api/tenant/[industry]/parse/route');
  POST = mod.POST;
});

describe('Tenant parse POST', () => {
  it('parses text for supported industry products', async () => {
    const req = {
      json: async () => ({ text: 'T-shirt - 3500 NGN' }),
      headers: { get: (k: string) => 'application/json' },
    } as any;

    const res: any = await POST(req, { params: { industry: 'products' } });
    expect(res).toBeDefined();
    // NextResponse.json returns a Response-like object
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('returns 404 for unsupported industry', async () => {
    const req = {
      json: async () => ({ text: 'X' }),
      headers: { get: (k: string) => 'application/json' },
    } as any;
    const res: any = await POST(req, { params: { industry: 'unknown' } });
    // NextResponse.json returns an object with status
    expect(res.status).toBe(404);
  });
});
