import { NextResponse } from 'next/server';
import parseJobs from '@/lib/parse-jobs';

// Support all industries for job status checking
const VALID_INDUSTRIES = new Set(['products', 'menu', 'services', 'offers', 'consultations']);

export async function GET(req: Request, { params }: { params: { industry: string; id: string } }) {
  try {
    const { industry, id } = params;
    // Allow all valid industry types - job status works for any industry
    if (!VALID_INDUSTRIES.has(industry)) {
      // Still allow other industry names, just log a warning
      console.warn(`Job status requested for industry: ${industry} (not in standard list, but allowing)`);
    }

    const job = await parseJobs.getJob(id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job_id: job.job_id, status: job.status, result: job.result ?? null, error: job.error ?? null });
  } catch (e) {
    console.error('Tenant job status error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
