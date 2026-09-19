import { ilike, isNull, and, inArray } from 'drizzle-orm';
import { db } from '@database/client.js';
import { ingredients, ingredientHealthEffects, researchSources, ingredientResearchSources } from '@database/schema/index.js';
import { embeddingService } from '../embeddings/embedding.service.js';
import { vectorStoreService } from '../embeddings/vector-store.service.js';
import { logger } from '@shared/logger/logger.js';

/** Minimum vector similarity for a result to be included. */
const VECTOR_SIMILARITY_THRESHOLD = 0.72;
/** Max vector results retrieved before re-ranking. */
const VECTOR_RESULT_LIMIT = 8;

export interface IngredientKnowledge {
  ingredientId: string;
  name: string;
  scientificName: string | null;
  eNumber: string | null;
  description: string | null;
  purpose: string | null;
  riskLevel: string;
  riskSummary: string | null;
  isNatural: boolean;
  isSynthetic: boolean;
  healthEffects: { effect: string; severity: string }[];
  researchSources: { label: string; url: string; publisher: string | null }[];
  /** How this knowledge entry was retrieved. */
  retrievalMethod: 'db_exact' | 'db_alias' | 'vector_similarity';
  /** 0–1 confidence in the match. */
  matchConfidence: number;
}

export interface KnowledgeContext {
  /** One entry per successfully retrieved ingredient. */
  results: IngredientKnowledge[];
  /**
   * Names that could not be resolved by any method — caller may
   * choose to log, skip, or surface as "unknown" to the user.
   */
  unresolved: string[];
}

/**
 * Ingredient Knowledge Retriever — AI Integration Layer Phase 4.
 *
 * Implements the Knowledge Retrieval stage of the AI Agent pipeline
 * (AI Agent LLD §8). Orchestrates a three-tier lookup:
 *
 *   Tier 1 — DB exact name match  (ilike, highest confidence)
 *   Tier 2 — DB alias array match (ingredient known by another label)
 *   Tier 3 — Vector similarity    (semantic fallback for unknowns)
 *
 * The same priority order is deliberately mirrored from
 * `IngredientMatchingAgent` so both paths (deterministic matching for
 * structured fields and knowledge retrieval for LLM context) stay
 * consistent — the same ingredient name will never resolve via Tier 1
 * in one place and Tier 3 in another.
 *
 * Result enrichment: once an ingredient ID is resolved by any tier, the
 * retriever fetches its full DB record including health effects and
 * research sources — giving the LLM's grounding context the maximum
 * detail available.
 */
export class IngredientKnowledgeRetriever {
  /**
   * Retrieve knowledge for a list of ingredient names.
   * Returns a `KnowledgeContext` with all resolved + unresolved names.
   */
  async retrieve(ingredientNames: string[]): Promise<KnowledgeContext> {
    if (ingredientNames.length === 0) {
      return { results: [], unresolved: [] };
    }

    const uniqueNames = [...new Set(ingredientNames.map((n) => n.trim()).filter(Boolean))];
    const results: IngredientKnowledge[] = [];
    const resolvedNames = new Set<string>();

    // --- Tier 1: DB exact name match (case-insensitive batch) ---
    const exactMatches = await this.dbExactBatch(uniqueNames);
    for (const match of exactMatches) {
      const knowledge = await this.enrichIngredient(match.id, 'db_exact', 1.0);
      if (knowledge) {
        results.push(knowledge);
        // Mark the original query name as resolved (lower-case compare)
        uniqueNames
          .filter((n) => n.toLowerCase() === match.name.toLowerCase())
          .forEach((n) => resolvedNames.add(n));
      }
    }

    // --- Tier 2: DB alias match for still-unresolved names ---
    const unresolvedAfterExact = uniqueNames.filter((n) => !resolvedNames.has(n));
    if (unresolvedAfterExact.length > 0) {
      const aliasMatches = await this.dbAliasBatch(unresolvedAfterExact);
      for (const { queryName, ingredient } of aliasMatches) {
        // Avoid duplicating if this ingredient was already found via exact match
        if (results.some((r) => r.ingredientId === ingredient.id)) {
          resolvedNames.add(queryName);
          continue;
        }
        const knowledge = await this.enrichIngredient(ingredient.id, 'db_alias', 0.95);
        if (knowledge) {
          results.push(knowledge);
          resolvedNames.add(queryName);
        }
      }
    }

    // --- Tier 3: Vector similarity for still-unresolved names ---
    const unresolvedAfterAlias = uniqueNames.filter((n) => !resolvedNames.has(n));
    if (unresolvedAfterAlias.length > 0) {
      for (const name of unresolvedAfterAlias) {
        const vectorResults = await this.vectorFallback(name);
        if (vectorResults.length > 0 && vectorResults[0]) {
          const top = vectorResults[0];
          // Skip if already retrieved this ingredient by a higher-confidence method
          if (!results.some((r) => r.ingredientId === top.ingredientId)) {
            const knowledge = await this.enrichIngredient(top.ingredientId, 'vector_similarity', top.similarity);
            if (knowledge) {
              results.push(knowledge);
            }
          }
          resolvedNames.add(name);
        }
      }
    }

    const unresolved = uniqueNames.filter((n) => !resolvedNames.has(n));

    logger.debug(
      { resolvedCount: results.length, unresolvedCount: unresolved.length },
      'knowledge retrieval complete'
    );

    return { results, unresolved };
  }

  // ---------------------------------------------------------------------------
  // Private — Tier implementations
  // ---------------------------------------------------------------------------

  /** Batch exact-name lookup for all supplied names in one query. */
  private async dbExactBatch(names: string[]) {
    return db
      .select({ id: ingredients.id, name: ingredients.name })
      .from(ingredients)
      .where(
        and(
          isNull(ingredients.deletedAt),
          // Use ilike for each name via inArray on the lowercased column isn't
          // directly possible with Drizzle's type-safe API — use a raw OR
          // via JavaScript Promise.all for simplicity and correctness.
          // For large batches this is acceptable; most label lists are ≤ 30 items.
          inArray(
            ingredients.name,
            names // exact string comparison (DB stores canonical casing)
          )
        )
      );
  }

  /** Alias match — find ingredients whose `aliases` array contains any of the query names. */
  private async dbAliasBatch(names: string[]): Promise<{ queryName: string; ingredient: { id: string } }[]> {
    const results: { queryName: string; ingredient: { id: string } }[] = [];

    // Alias matching requires an array-contains check per name — run concurrently.
    await Promise.all(
      names.map(async (name) => {
        const match = await db
          .select({ id: ingredients.id })
          .from(ingredients)
          .where(
            and(
              isNull(ingredients.deletedAt),
              // `name = ANY(aliases)` — same pattern as IngredientMatchingAgent
              ilike(ingredients.name, name) // fallback: also catch case-variant names
            )
          )
          .limit(1);

        // Primary alias check via raw SQL (mirrors ingredient-matching.agent.ts)
        const { sql: rawSql, db: dbClient } = await import('@database/client.js').then(
          async (m) => {
            const { sql: s } = await import('drizzle-orm');
            return { sql: s, db: m.db };
          }
        );

        const aliasResult = await dbClient.execute<{ id: string }>(rawSql`
          select id from ingredients
          where deleted_at is null
            and ${name} = any(aliases)
          limit 1
        `);

        if (aliasResult[0]) {
          results.push({ queryName: name, ingredient: { id: aliasResult[0].id } });
        } else if (match[0]) {
          results.push({ queryName: name, ingredient: { id: match[0].id } });
        }
      })
    );

    return results;
  }

  /** Vector similarity fallback — embed the query name and search pgvector. */
  private async vectorFallback(name: string) {
    try {
      const { vector } = await embeddingService.embed(name);
      return vectorStoreService.similaritySearch(vector, VECTOR_RESULT_LIMIT, VECTOR_SIMILARITY_THRESHOLD);
    } catch (err) {
      logger.warn({ err, name }, 'knowledge retriever: vector fallback failed, skipping');
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Full enrichment
  // ---------------------------------------------------------------------------

  /**
   * Fetch the full ingredient record including health effects and research
   * sources for LLM grounding context.
   */
  private async enrichIngredient(
    ingredientId: string,
    method: IngredientKnowledge['retrievalMethod'],
    confidence: number
  ): Promise<IngredientKnowledge | null> {
    try {
      const [row] = await db
        .select()
        .from(ingredients)
        .where(and(ilike(ingredients.id, ingredientId), isNull(ingredients.deletedAt)))
        .limit(1);

      if (!row) return null;

      const healthEffects = await db
        .select({ effect: ingredientHealthEffects.effect, severity: ingredientHealthEffects.severity })
        .from(ingredientHealthEffects)
        .where(ilike(ingredientHealthEffects.ingredientId, ingredientId));

      const sources = await db
        .select({ label: researchSources.label, url: researchSources.url, publisher: researchSources.publisher })
        .from(researchSources)
        .innerJoin(
          ingredientResearchSources,
          ilike(ingredientResearchSources.researchSourceId, researchSources.id)
        )
        .where(ilike(ingredientResearchSources.ingredientId, ingredientId));

      return {
        ingredientId: row.id,
        name: row.name,
        scientificName: row.scientificName,
        eNumber: row.eNumber,
        description: row.description,
        purpose: row.purpose,
        riskLevel: row.riskLevel,
        riskSummary: row.riskSummary,
        isNatural: row.isNatural,
        isSynthetic: row.isSynthetic,
        healthEffects,
        researchSources: sources,
        retrievalMethod: method,
        matchConfidence: confidence,
      };
    } catch (err) {
      logger.error({ err, ingredientId }, 'knowledge retriever: enrichment query failed');
      return null;
    }
  }
}

export const ingredientKnowledgeRetriever = new IngredientKnowledgeRetriever();
