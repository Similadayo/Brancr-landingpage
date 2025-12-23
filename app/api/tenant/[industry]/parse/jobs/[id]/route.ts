import { NextResponse } from 'next/server';
import parseJobs from '@/lib/parse-jobs';

const SUPPORTED = new Set(['products', 'menu']);

export async function GET(req: Request, { params }: { params: { industry: string; id: string } }) {
  try {
    const { industry, id } = params;
    if (!SUPPORTED.has(industry)) return NextResponse.json({ error: 'Unsupported industry' }, { status: 404 });

    const job = await parseJobs.getJob(id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job_id: job.job_id, status: job.status, result: job.result ?? null, error: job.error ?? null });
  } catch (e) {
    console.error('Tenant job status error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
