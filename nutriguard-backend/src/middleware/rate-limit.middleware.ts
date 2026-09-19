import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { RateLimitError } from '@shared/errors/app-error.js';
import type { AppEnv } from '@shared/types/hono-env.js';

interface RateLimitOptions {
  /** Window size in milliseconds. */
  windowMs: number;
  /** Max requests allowed per key within the window. */
  max: number;
  /** How to derive the bucket key — defaults to per-user (falls back to IP for guests). */
  keyGenerator?: (c: Context<AppEnv>) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory fixed-window rate limiter. Suitable for a single-instance
 * deployment or the MVP stage described in the HLD.
 *
 * PRODUCTION NOTE: once deployed across multiple Vercel/Edge instances,
 * replace the `Map` below with a shared store (Upstash Redis is the
 * natural fit alongside Vercel) so limits are enforced globally rather
 * than per-instance — the function signature below is intentionally
 * store-agnostic so that swap doesn't touch call sites.
 */
const buckets = new Map<string, Bucket>();

function defaultKeyGenerator(c: Context<AppEnv>): string {
  const user = c.get('user');
  if (user) return `user:${user.id}`;
  const forwarded = c.req.header('x-forwarded-for');
  return `ip:${forwarded?.split(',')[0]?.trim() ?? 'unknown'}`;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator = defaultKeyGenerator } = options;

  return createMiddleware<AppEnv>(async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (existing.count >= max) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      throw new RateLimitError('Too many requests. Please try again later.', retryAfterSeconds);
    }

    existing.count += 1;
    await next();
  });
}

/** Pre-configured limiter tiers matching the API Specification §18. */
export const rateLimitTiers = {
  auth: rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  aiCompute: rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }),
  authenticated: rateLimit({ windowMs: 5 * 60 * 1000, max: 300 }),
  guest: rateLimit({ windowMs: 60 * 1000, max: 60 }),
};
  