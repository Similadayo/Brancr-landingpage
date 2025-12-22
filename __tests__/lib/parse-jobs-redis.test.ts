import parseJobs from '@/lib/parse-jobs';

describe('parse-jobs redis fallback', () => {
  it('works with in-memory when redis not configured', async () => {
    const job = await parseJobs.createJobFromText('Jollof Rice - ₦3,500');
    expect(job.status).toBe('pending');
    // wait for job to complete
    let finished = null;
    const start = Date.now();
    while (Date.now() - start < 6000) {
      const j = await parseJobs.getJob(job.job_id as string);
      if (j && j.status !== 'pending') { finished = j; break; }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(finished).not.toBeNull();
    expect(finished.status).toBe('done');
  });
});