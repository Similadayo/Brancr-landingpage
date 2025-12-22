import { NextResponse } from 'next/server';
import parseJobs from '@/lib/parse-jobs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const job = parseJobs.getJob(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job_id: job.job_id, status: job.status, result: job.result ?? null, error: job.error ?? null });
  } catch (e) {
    console.error('Job status error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
