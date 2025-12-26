import { NextResponse } from 'next/server';
import { parseText } from '@/lib/parse-products';
import aiParseText from '@/lib/ai-parser';

// Support all industries for parsing
const VALID_INDUSTRIES = new Set(['products', 'menu', 'services', 'offers', 'consultations']);

export async function POST(req: Request, { params }: { params: { industry: string } }) {
  try {
    const { industry } = params;
    // Allow all valid industry types - parsing works for any industry
    if (!VALID_INDUSTRIES.has(industry)) {
      // Still allow other industry names, just log a warning
      console.warn(`Parsing requested for industry: ${industry} (not in standard list, but allowing)`);
    }

    const body = await req.json();
    const text = (body && body.text) ? String(body.text) : '';
    if (!text.trim()) return NextResponse.json([], { status: 200 });

    // Use AI parser when available (fall back to heuristic parse)
    const items = await aiParseText(text);
    return NextResponse.json(items);
  } catch (e) {
    console.error('Tenant parse route error:', e);
    return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
  }
}
