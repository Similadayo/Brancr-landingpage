import { parseText, ParsedItem } from './parse-products';

// This module supports two modes: in-memory (default) and Redis-backed when REDIS_URL env var is set.
// The Redis implementation is optional and will be used only when the runtime includes a redis client and REDIS_URL.

type Job = {
  job_id: string;
  status: 'pending' | 'done' | 'failed';
  result?: ParsedItem[];
  error?: string;
};

const USE_REDIS = !!process.env.REDIS_URL;
let redisClient: any = null;

if (USE_REDIS) {
  try {
    // require lazily so environments without the package don't fail
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redis = require('redis');
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch((e: any) => console.error('Redis connect failed:', e));
  } catch (err) {
    console.warn('Redis package not available, falling back to in-memory jobs');
    redisClient = null;
  }
}

const jobs = new Map<string, Job>();

function randomId() {
  return 'job_' + Math.random().toString(36).slice(2, 10);
}

async function storeJob(job: Job) {
  if (redisClient) {
    await redisClient.set(`parse:job:${job.job_id}`, JSON.stringify(job));
  } else {
    jobs.set(job.job_id, job);
  }
}

async function loadJob(job_id: string): Promise<Job | undefined> {
  if (redisClient) {
    const raw = await redisClient.get(`parse:job:${job_id}`);
    return raw ? JSON.parse(raw) : undefined;
  }
  return jobs.get(job_id);
}

export async function createJobFromText(text: string) {
  const job_id = randomId();
  const job: Job = { job_id, status: 'pending' };

  await storeJob(job);

  // Simulate background processing (in production this would be a worker)
  setTimeout(async () => {
    try {
      const items = parseText(text);
      job.status = 'done';
      job.result = items;
      await storeJob(job);
      try { const { captureMessage } = require('./observability'); captureMessage('parse.job.completed', 'info', { job_id: job.job_id, item_count: items.length }); } catch(e) { /* ignore */ }
    } catch (e: any) {
      job.status = 'failed';
      job.error = e?.message || String(e);
      await storeJob(job);
      try { const { captureException } = require('./observability'); captureException(e, { job_id: job.job_id }); } catch(err) { /* ignore */ }
    }
  }, 1500 + Math.floor(Math.random() * 2000)); // 1.5-3.5s

  return job;
}

export async function getJob(job_id: string) {
  return await loadJob(job_id);
}

export async function createJobFromBufferText(bufferText: string) {
  // re-use same function for text payload
  return await createJobFromText(bufferText);
}

export default { createJobFromText, getJob, createJobFromBufferText };
