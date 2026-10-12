// Node-safe in-memory sliding-window rate limiter.
// Dev/small-deployment grade: single process. Postgres/Redis backing is planned
// with the production adapter; limits below still protect local API routes.
interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, maxPerMinute: number, now = Date.now()): RateLimitResult {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);
  if (bucket.hits.length >= maxPerMinute) {
    const oldest = bucket.hits[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
    };
  }
  bucket.hits.push(now);
  return { allowed: true, remaining: maxPerMinute - bucket.hits.length, retryAfterSec: 0 };
}

/** Test-only reset. */
export function resetRateLimits(): void {
  buckets.clear();
}
