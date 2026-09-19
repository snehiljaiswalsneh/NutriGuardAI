import { createHash } from 'node:crypto';
import { LruCache } from './cache.interface.js';
import { logger } from '@shared/logger/logger.js';

/** Max cached prompt responses in-process. Covers roughly 500 unique product scans. */
const MAX_ENTRIES = 500;
/** Cached prompt responses expire after 15 minutes — balances freshness vs. API cost. */
const TTL_MS = 15 * 60 * 1_000;

/**
 * Prompt Cache — AI Integration Layer Phase 8.
 *
 * Caches LLM structured-output responses keyed on a SHA-256 hash of
 * `systemPrompt + userPrompt`. Identical prompts (same grounding context
 * and same product data) will always produce the same deterministic
 * output — caching them avoids redundant API calls and latency.
 *
 * When to use:
 * - Summary Agent: if a product's ingredient list hasn't changed since
 *   the last scan, the summary prompt hash is identical → cache hit.
 * - Comparison Agent: same two products in the same order → cache hit.
 *
 * When NOT to use:
 * - One-off, highly variable prompts where the cache hit rate is ~0%.
 *
 * Cache key construction:
 * SHA-256(systemPrompt + "\x00" + userPrompt) — the null byte separator
 * prevents key collisions from content that naturally crosses the boundary
 * (e.g., a systemPrompt ending in "foo" and userPrompt starting with "bar"
 * vs. systemPrompt ending in "foob" and userPrompt starting with "ar").
 */
class PromptCache {
  private readonly lru = new LruCache<string, unknown>(MAX_ENTRIES, TTL_MS);

  /** Returns the cached response, or `undefined` on a miss. */
  get<T>(systemPrompt: string, userPrompt: string): T | undefined {
    const key = this.hashKey(systemPrompt, userPrompt);
    const hit = this.lru.get(key) as T | undefined;
    if (hit !== undefined) {
      logger.debug({ keyPrefix: key.slice(0, 8) }, 'prompt cache: hit');
    }
    return hit;
  }

  /** Store a response in the cache. */
  set<T>(systemPrompt: string, userPrompt: string, value: T): void {
    const key = this.hashKey(systemPrompt, userPrompt);
    this.lru.set(key, value);
    logger.debug({ keyPrefix: key.slice(0, 8), cacheSize: this.lru.size() }, 'prompt cache: stored');
  }

  /** Remove a specific entry (e.g., after a knowledge-base update). */
  invalidate(systemPrompt: string, userPrompt: string): void {
    const key = this.hashKey(systemPrompt, userPrompt);
    this.lru.delete(key);
  }

  /** Flush all cached prompt responses. */
  clear(): void {
    this.lru.clear();
  }

  get size(): number {
    return this.lru.size();
  }

  private hashKey(systemPrompt: string, userPrompt: string): string {
    return createHash('sha256')
      .update(systemPrompt + '\x00' + userPrompt)
      .digest('hex');
  }
}

/** Singleton — shared across all agents in the same process. */
export const promptCache = new PromptCache();
