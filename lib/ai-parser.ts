import { parseText, ParsedItem } from './parse-products';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function aiParseText(text: string): Promise<ParsedItem[]> {
  // If no API key configured, fall back to local heuristic parser
  const key = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!key) return parseText(text);

  // Construct a concise prompt asking AI to extract JSON only
  const system = `You are a parser. Extract a JSON array of items from the user's unstructured text. Return ONLY valid JSON (no commentary).
Each item should be an object with keys: name (string), price (number|null), currency (string|null), type (string|null), confidence (number 0-1).
If price is missing, set price to null and confidence to 0.6. Do not invent prices.`;
  const user = `Input:\n\n${text}`;

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-preview',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      console.error('AI parse failed', res.status, await res.text());
      return parseText(text);
    }

    const body = await res.json();
    const content = (body?.choices?.[0]?.message?.content) ?? '';

    // Try to locate JSON in the content
    const firstJson = extractFirstJson(content);
    if (!firstJson) {
      console.error('AI response missing JSON, falling back');
      return parseText(text);
    }

    // Parse and validate structure
    const parsed = JSON.parse(firstJson) as any[];
    const items: ParsedItem[] = parsed.map((p) => ({
      name: String(p.name || '').trim(),
      price: p.price == null ? null : Number(p.price),
      currency: p.currency ?? null,
      type: p.type ?? null,
      confidence: typeof p.confidence === 'number' ? p.confidence : 0.8,
      raw: p.raw ?? undefined,
    }));

    return items;
  } catch (e) {
    console.error('AI parse error:', e);
    return parseText(text);
  }
}

function extractFirstJson(s: string): string | null {
  const start = s.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}

export default aiParseText;
