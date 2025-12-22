import { NextResponse } from 'next/server';
import { parseText } from '@/lib/parse-products';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await (req as any).formData();
      const image = form.get('image') as File | null;
      if (!image) return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });

      // For now, do a naive text extraction by reading text() on the file (useful for images provided as text in tests)
      const text = await (image as any).text();
      // In real implementation, call OCR here and then parse
      const items = parseText(text || '');
      return NextResponse.json(items);
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (e) {
    console.error('Image parse error:', e);
    return NextResponse.json({ error: 'Failed to parse image' }, { status: 500 });
  }
}
