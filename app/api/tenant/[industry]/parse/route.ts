import { NextResponse } from 'next/server';
import { parseText } from '@/lib/parse-products';
import aiParseText from '@/lib/ai-parser';

const SUPPORTED = new Set(['products', 'menu']);

export async function POST(req: Request, { params }: { params: { industry: string } }) {
  try {
    const { industry } = params;
    if (!SUPPORTED.has(industry)) return NextResponse.json({ error: 'Unsupported industry' }, { status: 404 });

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
