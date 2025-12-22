import { NextResponse } from 'next/server';
import { parseText } from '@/lib/parse-products';
import aiParseText from '@/lib/ai-parser';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body && body.text) ? String(body.text) : '';
    if (!text.trim()) return NextResponse.json([], { status: 200 });

    // Use AI parser when available (fall back to heuristic parse)
    const items = await aiParseText(text);
    return NextResponse.json(items);
  } catch (e) {
    console.error('Parse route error:', e);
    return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
  }
}
