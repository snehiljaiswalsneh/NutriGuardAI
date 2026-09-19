import { sql } from 'drizzle-orm';
import { db } from '@database/client.js';
import { logger } from '@shared/logger/logger.js';
import { DatabaseError } from '@shared/errors/app-error.js';

/**
 * Minimum cosine similarity score (0–1 scale) that a vector result
 * must reach to be returned. pgvector's `<=>` operator returns
 * *distance* (0 = identical, 2 = opposite), so this threshold is
 * converted: similarity ≥ 0.70  ⟺  distance ≤ 0.30.
 */
const DEFAULT_SIMILARITY_THRESHOLD = 0.70;
const DEFAULT_LIMIT = 5;

export interface SimilarityResult {
  ingredientId: string;
  name: string;
  riskLevel: string;
  /** Cosine similarity in [0, 1] — higher is more similar. */
  similarity: number;
}

export interface UpsertEmbeddingInput {
  ingredientId: string;
  /** Pre-computed embedding vector from EmbeddingService. */
  vector: number[];
  /** Ingredient canonical name — stored alongside the vector for
   *  efficient result hydration without a JOIN in every search query. */
  name: string;
  riskLevel: string;
}

/**
 * Vector Store Service — AI Integration Layer Phase 3.
 *
 * Wraps all pgvector interactions for the `ingredient_embeddings` table.
 * Drizzle ORM does not model pgvector columns natively (the `vector`
 * type requires a raw SQL custom type with no meaningful type-safety
 * benefit), so all queries here use Drizzle's `sql` template literal —
 * exactly the same pattern used by `IngredientMatchingAgent` for the
 * `tsvector` full-text search (AI Agent LLD §8).
 *
 * Schema assumed (created by a raw-SQL migration supplement):
 *
 * ```sql
 * create extension if not exists vector;
 *
 * create table ingredient_embeddings (
 *   ingredient_id  uuid primary key references ingredients(id) on delete cascade,
 *   name           text not null,
 *   risk_level     risk_level not null default 'unknown',
 *   embedding      vector(3072) not null,   -- text-embedding-3-large dims
 *   created_at     timestamptz not null default now(),
 *   updated_at     timestamptz not null default now()
 * );
 *
 * create index on ingredient_embeddings
 *   using ivfflat (embedding vector_cosine_ops) with (lists = 100);
 * ```
 */
export class VectorStoreService {
  /**
   * Insert or update an ingredient's embedding vector.
   * Safe to call repeatedly — uses `ON CONFLICT DO UPDATE` so re-seeding
   * after a re-classification just overwrites the old vector.
   */
  async upsertEmbedding(input: UpsertEmbeddingInput): Promise<void> {
    try {
      // pgvector expects the vector literal as a bracketed comma-separated
      // float string: '[0.123, -0.456, ...]'
      const vectorLiteral = `[${input.vector.join(',')}]`;

      await db.execute(sql`
        insert into ingredient_embeddings (ingredient_id, name, risk_level, embedding)
        values (
          ${input.ingredientId}::uuid,
          ${input.name},
          ${input.riskLevel}::risk_level,
          ${vectorLiteral}::vector
        )
        on conflict (ingredient_id) do update set
          name        = excluded.name,
          risk_level  = excluded.risk_level,
          embedding   = excluded.embedding,
          updated_at  = now()
      `);

      logger.debug({ ingredientId: input.ingredientId }, 'vector store: embedding upserted');
    } catch (err) {
      logger.error({ err, ingredientId: input.ingredientId }, 'vector store: upsert failed');
      throw new DatabaseError('Failed to upsert ingredient embedding', undefined, err);
    }
  }

  /**
   * Find the most similar ingredient embeddings to the given query vector.
   *
   * Uses the pgvector cosine distance operator `<=>` for the ORDER BY,
   * then filters by the converted similarity threshold in the WHERE clause
   * so the IVFFlat index is fully utilised (distance-based filter on
   * an indexed column).
   *
   * @param queryVector — embedding of the search text (from EmbeddingService)
   * @param limit       — max results to return (default 5)
   * @param threshold   — min cosine similarity in [0,1] (default 0.70)
   */
  async similaritySearch(
    queryVector: number[],
    limit = DEFAULT_LIMIT,
    threshold = DEFAULT_SIMILARITY_THRESHOLD
  ): Promise<SimilarityResult[]> {
    try {
      const vectorLiteral = `[${queryVector.join(',')}]`;
      // pgvector distance: 0 = identical, 2 = maximally different
      // similarity = 1 - (distance / 2)  for cosine.
      // Threshold 0.70 similarity → max distance 0.30 * 2 = 0.60.
      const maxDistance = (1 - threshold) * 2;

      const rows = await db.execute<{
        ingredient_id: string;
        name: string;
        risk_level: string;
        distance: number;
      }>(sql`
        select
          ingredient_id,
          name,
          risk_level,
          (embedding <=> ${vectorLiteral}::vector) as distance
        from ingredient_embeddings
        where (embedding <=> ${vectorLiteral}::vector) <= ${maxDistance}
        order by distance asc
        limit ${limit}
      `);

      return rows.map((row) => ({
        ingredientId: row.ingredient_id,
        name: row.name,
        riskLevel: row.risk_level,
        // Convert distance back to similarity for caller convenience
        similarity: Math.max(0, 1 - row.distance / 2),
      }));
    } catch (err) {
      logger.error({ err }, 'vector store: similarity search failed');
      throw new DatabaseError('Failed to perform vector similarity search', undefined, err);
    }
  }

  /**
   * Delete an ingredient's embedding (called when an ingredient is
   * hard-deleted from the knowledge base).
   */
  async deleteEmbedding(ingredientId: string): Promise<void> {
    try {
      await db.execute(sql`
        delete from ingredient_embeddings where ingredient_id = ${ingredientId}::uuid
      `);
      logger.debug({ ingredientId }, 'vector store: embedding deleted');
    } catch (err) {
      logger.error({ err, ingredientId }, 'vector store: delete failed');
      throw new DatabaseError('Failed to delete ingredient embedding', undefined, err);
    }
  }

  /**
   * Returns the total number of embeddings indexed — useful for health
   * checks and seeding progress reporting.
   */
  async count(): Promise<number> {
    const result = await db.execute<{ cnt: string }>(sql`
      select count(*) as cnt from ingredient_embeddings
    `);
    return parseInt(result[0]?.cnt ?? '0', 10);
  }
}

export const vectorStoreService = new VectorStoreService();
