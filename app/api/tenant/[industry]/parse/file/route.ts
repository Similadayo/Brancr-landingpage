import { NextResponse } from 'next/server';
import parseJobs from '@/lib/parse-jobs';
import { parseText } from '@/lib/parse-products';

// Support all industries for file parsing
const VALID_INDUSTRIES = new Set(['products', 'menu', 'services']);

export async function POST(req: Request, { params }: { params: { industry: string } }) {
  try {
    const { industry } = params;
    // Allow all valid industry types - file parsing works for any industry
    if (!VALID_INDUSTRIES.has(industry)) {
      // Still allow other industry names, just log a warning
      console.warn(`File parsing requested for industry: ${industry} (not in standard list, but allowing)`);
    }

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await (req as any).formData();
      const file = form.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

      // For small files, parse synchronously
      const size = (file as any).size ?? 0;
      const text = await (file as any).text();
      if (size <= 2 * 1024 * 1024) { // <= 2MB
        const items = parseText(text);
        return NextResponse.json(items);
      }

      // Large file: create background job
      const job = await parseJobs.createJobFromBufferText(text) as any;
      return NextResponse.json({ status: 'accepted', job_id: job.job_id }, { status: 202 });
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (e) {
    console.error('Tenant file parse error:', e);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
