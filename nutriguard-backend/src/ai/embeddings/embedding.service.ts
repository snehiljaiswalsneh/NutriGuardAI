import { geminiClient } from '../clients/gemini.client.js';
import { embeddingCache } from '../cache/embedding-cache.js';
import { logger } from '@shared/logger/logger.js';
import { AiProviderError } from '@shared/errors/app-error.js';

/**
 * Maximum characters passed to the embedding model in a single call.
 * text-embedding-3-large supports ~8 191 tokens; 8 000 chars is a
 * conservative safe limit (1 token ≈ 4 chars on average for English).
 */
const MAX_CHARS = 8_000;

/**
 * Maximum concurrent embedding calls issued in a batch. Stays under
 * OpenAI's default RPM limits while keeping batch latency acceptable.
 */
const BATCH_CONCURRENCY = 5;

export interface EmbeddingResult {
  text: string;
  vector: number[];
  /** True when the vector was served from the in-process LRU cache. */
  cacheHit: boolean;
}

/**
 * Embedding Service — AI Integration Layer Phase 3.
 *
 * Responsibilities:
 * 1. Normalize + truncate text before calling the model (prevents
 *    silent token-overflow truncation by the SDK).
 * 2. Cache vectors in-process so identical ingredient names never
 *    trigger a redundant API call in the same process lifecycle.
 * 3. Expose a batch API that respects provider concurrency limits.
 *
 * Callers:
 * - `VectorStoreService.upsertEmbedding()` — when seeding/updating the
 *   ingredient vector index.
 * - `IngredientKnowledgeRetriever` — to embed the query ingredient text
 *   before a similarity search.
 *
 * This service is intentionally decoupled from the LLM orchestration
 * client — embeddings use OpenAI exclusively (no Anthropic fallback,
 * because Anthropic does not offer an embeddings API).
 */
export class EmbeddingService {
  /**
   * Generate an embedding vector for a single text string.
   * Returns from the LRU cache if the normalized text was seen before.
   */
  async embed(text: string): Promise<EmbeddingResult> {
    const normalized = this.normalize(text);

    const cached = embeddingCache.get(normalized);
    if (cached) {
      logger.debug({ textLength: normalized.length }, 'embedding cache hit');
      return { text: normalized, vector: cached, cacheHit: true };
    }

    logger.debug({ textLength: normalized.length }, 'generating embedding via Gemini');
    const vector = await geminiClient.generateEmbedding(normalized);
    embeddingCache.set(normalized, vector);

    return { text: normalized, vector, cacheHit: false };
  }

  /**
   * Generate embedding vectors for multiple texts in parallel.
   * Respects `BATCH_CONCURRENCY` to avoid overwhelming the provider.
   *
   * @param texts — raw text strings (will be individually normalized)
   * @returns results in the same order as the input array
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    const results: EmbeddingResult[] = new Array(texts.length);

    // Process in chunks of BATCH_CONCURRENCY
    for (let i = 0; i < texts.length; i += BATCH_CONCURRENCY) {
      const chunk = texts.slice(i, i + BATCH_CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((t) => this.embed(t)));
      chunkResults.forEach((r, j) => {
        results[i + j] = r;
      });
    }

    return results;
  }

  /**
   * Compute cosine similarity between two L2-normalised vectors.
   * Returns a value in [-1, 1]; higher = more similar.
   * Used by callers that want to re-rank results client-side.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new AiProviderError('Cannot compute cosine similarity: vector dimensions differ');
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Normalize a text string before embedding:
   * 1. Collapse whitespace / newlines.
   * 2. Convert to lower-case (embedding model is case-sensitive, but
   *    ingredient names from labels vary in capitalisation).
   * 3. Hard-truncate to MAX_CHARS so the SDK never silently truncates
   *    inside the model call.
   */
  private normalize(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .slice(0, MAX_CHARS);
  }
}

export const embeddingService = new EmbeddingService();
