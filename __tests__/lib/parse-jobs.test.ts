import parseJobs from '@/lib/parse-jobs';

describe('parse-jobs', () => {
  it('creates a job and eventually completes', async () => {
    const job = await parseJobs.createJobFromText('Jollof Rice - ₦3,500');
    expect(job.status).toBe('pending');
    // wait for job to complete (max 5s)
    const start = Date.now();
    let finished: any = null;
    while (Date.now() - start < 6000) {
      // getJob is async now
      const j = await parseJobs.getJob(job.job_id as string);
      if (j && j.status !== 'pending') { finished = j; break; }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(finished).not.toBeNull();
    expect(finished.status).toBe('done');
    expect(Array.isArray(finished.result)).toBe(true);
  });
});