#!/usr/bin/env node
// Simple parse worker that pops job ids from Redis list 'parse:queue' and processes them

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('REDIS_URL not set — parse worker requires Redis');
  process.exit(1);
}

(async () => {
  try {
    // Lazy require to avoid adding dependency until needed
    const { createClient } = require('redis');
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    console.log('Parse worker connected to Redis. Waiting for jobs...');

    const { parseText } = require('../lib/parse-products');

    while (true) {
      try {
        // BRPOP returns [key, element]
        const res = await client.brPop('parse:queue', 0);
        if (!res) continue;
        const jobId = res.element;
        console.log('Picked job', jobId);
        const raw = await client.get(`parse:job:${jobId}`);
        if (!raw) {
          console.warn('Job payload missing for', jobId);
          continue;
        }
        const job = JSON.parse(raw);
        const text = job.text || '';
        try {
          const items = parseText(text);
          job.status = 'done';
          job.result = items;
          await client.set(`parse:job:${jobId}`, JSON.stringify(job));
          // send observability message (best-effort)
          try { await client.publish('parse:events', JSON.stringify({ type: 'job:done', job_id: jobId, item_count: items.length })); } catch(e){/*ignore*/}
        } catch (err) {
          job.status = 'failed';
          job.error = String(err);
          await client.set(`parse:job:${jobId}`, JSON.stringify(job));
          try { await client.publish('parse:events', JSON.stringify({ type: 'job:failed', job_id: jobId })); } catch(e){/*ignore*/}
        }
      } catch (e) {
        console.error('Worker loop error:', e);
        // small delay before retrying
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  } catch (e) {
    console.error('Failed to start parse worker:', e);
    process.exit(1);
  }
})();
