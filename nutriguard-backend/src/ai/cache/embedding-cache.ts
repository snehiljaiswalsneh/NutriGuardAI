import { LruCache } from './cache.interface.js';
import { logger } from '@shared/logger/logger.js';

/**
 * Max cached embedding vectors.
 * Each `text-embedding-3-large` vector is 3072 float32s = ~12 KB.
 * 2000 entries ≈ 24 MB RAM — acceptable for a server process.
 */
const MAX_ENTRIES = 2_000;
/** Embeddings expire after 1 hour — vectors are stable but knowledge-base
 *  updates could change what the "best" match is for a given text. */
const TTL_MS = 60 * 60 * 1_000;

/**
 * Embedding Cache — AI Integration Layer Phase 8.
 *
 * Caches `number[]` vectors keyed on normalized ingredient text.
 * Embedding the same ingredient name repeatedly (e.g., "Sodium Nitrite"
 * appears in multiple product scans) costs ~$0.00001 per call with
 * `text-embedding-3-large`. This cache makes repeated scans effectively
 * free after the first.
 *
 * Used by:
 * - `EmbeddingService.embed()` — checks the cache before calling OpenAI.
 * - `EmbeddingService.embedBatch()` — each text is checked individually.
 *
 * Cache key: normalized text (lower-cased, whitespace-collapsed) so
 * "Sodium Nitrite", "sodium nitrite", and "sodium  nitrite" all hit the
 * same cache entry — matching the normalization in `EmbeddingService`.
 */
class EmbeddingCache {
  private readonly lru = new LruCache<string, number[]>(MAX_ENTRIES, TTL_MS);

  /** Returns the cached vector, or `undefined` on a miss. */
  get(normalizedText: string): number[] | undefined {
    const hit = this.lru.get(normalizedText);
    if (hit) {
      logger.debug({ textLength: normalizedText.length }, 'embedding cache: hit');
    }
    return hit;
  }

  /** Store a vector in the cache. */
  set(normalizedText: string, vector: number[]): void {
    this.lru.set(normalizedText, vector);
    logger.debug(
      { textLength: normalizedText.length, cacheSize: this.lru.size() },
      'embedding cache: stored'
    );
  }

  /** Remove a specific text's vector (e.g., after ingredient rename). */
  invalidate(normalizedText: string): void {
    this.lru.delete(normalizedText);
  }

  /** Flush all cached vectors. */
  clear(): void {
    this.lru.clear();
  }

  get size(): number {
    return this.lru.size();
  }
}

/** Singleton — shared across EmbeddingService instances in the same process. */
export const embeddingCache = new EmbeddingCache();
