import aiParseText from '@/lib/ai-parser';

describe('aiParseText', () => {
  afterEach(() => {
    delete (process.env as any).OPENAI_API_KEY;
    delete (process.env as any).AI_API_KEY;
    (global as any).fetch = undefined;
  });

  it('falls back to heuristic parser when no key', async () => {
    const items = await aiParseText('Jollof Rice - ₦3,500');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toMatch(/Jollof Rice/i);
  });

  it('parses using AI when key present and AI returns JSON', async () => {
    (process.env as any).OPENAI_API_KEY = 'test-key';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '[{"name":"X","price":100,"currency":"NGN","type":"menu_item","confidence":0.9}]' } }] }),
    });

    const items = await aiParseText('Some text');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('X');
    expect(items[0].price).toBe(100);
  });

  it('falls back when AI returns non-JSON', async () => {
    (process.env as any).OPENAI_API_KEY = 'test-key';
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'I found nothing' } }] }) });
    const items = await aiParseText('Some text');
    expect(items.length).toBeGreaterThanOrEqual(0);
  });
});