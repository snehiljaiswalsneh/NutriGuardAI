import { ilike, isNull, and, sql } from 'drizzle-orm';
import { db } from '@database/client.js';
import { ingredients } from '@database/schema/index.js';
import { logger } from '@shared/logger/logger.js';

export interface MatchedIngredient {
  rawText: string;
  position: number;
  ingredientId: string;
  canonicalName: string;
  riskLevel: string;
  matchMethod: 'exact' | 'alias' | 'fuzzy_trigram';
  matchConfidence: number;
}

export interface UnmatchedFragment {
  rawText: string;
  position: number;
  reason: 'no_db_match' | 'below_confidence_threshold';
}

export interface IngredientMatchingResult {
  matched: MatchedIngredient[];
  unmatched: UnmatchedFragment[];
  confidence: number;
}

const FUZZY_MATCH_THRESHOLD = 0.35;

/**
 * Implements AI Agent LLD §2/§8: Input Handler -> Ingredient Parser ->
 * Normalization Engine -> Knowledge Retrieval (database lookup stage,
 * before any LLM is invoked). Splits a raw, comma/newline-separated
 * ingredient label into fragments and resolves each against the
 * `ingredients` table using exact name match, alias array match, and
 * finally trigram fuzzy match — in that priority order, matching the
 * `match_method` values the Ingredient Agent JSON Schema expects.
 *
 * Deliberately contains NO LLM call — this is the deterministic
 * retrieval stage the project's core requirement mandates run first.
 */
export class IngredientMatchingAgent {
  parseFragments(rawIngredientText: string): string[] {
    return rawIngredientText
      .split(/[,\n]/)
      .map((fragment) => fragment.trim())
      .filter((fragment) => fragment.length > 0);
  }

  async match(rawIngredientText: string): Promise<IngredientMatchingResult> {
    const fragments = this.parseFragments(rawIngredientText);
    const matched: MatchedIngredient[] = [];
    const unmatched: UnmatchedFragment[] = [];

    for (let position = 0; position < fragments.length; position++) {
      const fragment = fragments[position]!;
      const result = await this.resolveFragment(fragment);

      if (result) {
        matched.push({ rawText: fragment, position, ...result });
      } else {
        unmatched.push({ rawText: fragment, position, reason: 'no_db_match' });
      }
    }

    const confidence =
      matched.length === 0 ? 0 : matched.reduce((sum, m) => sum + m.matchConfidence, 0) / matched.length;

    logger.debug({ matchedCount: matched.length, unmatchedCount: unmatched.length }, 'ingredient matching complete');

    return { matched, unmatched, confidence };
  }

  private async resolveFragment(fragment: string): Promise<Omit<MatchedIngredient, 'rawText' | 'position'> | null> {
    // 1. Exact name match (case-insensitive) — highest confidence.
    const exactMatch = await db
      .select()
      .from(ingredients)
      .where(and(ilike(ingredients.name, fragment), isNull(ingredients.deletedAt)))
      .limit(1);

    if (exactMatch[0]) {
      return this.toMatch(exactMatch[0], 'exact', 1.0);
    }

    // 2. Alias array match — e.g. "Yellow 5" -> Tartrazine.
    const aliasMatch = await db
      .select()
      .from(ingredients)
      .where(and(sql`${fragment} = any(${ingredients.aliases})`, isNull(ingredients.deletedAt)))
      .limit(1);

    if (aliasMatch[0]) {
      return this.toMatch(aliasMatch[0], 'alias', 0.95);
    }

    // 3. Fuzzy trigram similarity — handles typos, minor label variations,
    // and E-number-only fragments ("E250" instead of "Sodium Nitrite").
    const fuzzyMatch = await db.execute(sql`
      select *, similarity(name, ${fragment}) as sim
      from ingredients
      where deleted_at is null and similarity(name, ${fragment}) > ${FUZZY_MATCH_THRESHOLD}
      order by sim desc
      limit 1
    `);

    const fuzzyRow = fuzzyMatch[0] as (typeof ingredients.$inferSelect & { sim: number }) | undefined;
    if (fuzzyRow && fuzzyRow.sim >= FUZZY_MATCH_THRESHOLD) {
      return this.toMatch(fuzzyRow, 'fuzzy_trigram', Math.min(0.9, fuzzyRow.sim));
    }

    return null;
  }

  private toMatch(
    row: typeof ingredients.$inferSelect,
    method: MatchedIngredient['matchMethod'],
    confidence: number
  ): Omit<MatchedIngredient, 'rawText' | 'position'> {
    return {
      ingredientId: row.id,
      canonicalName: row.name,
      riskLevel: row.riskLevel,
      matchMethod: method,
      matchConfidence: confidence,
    };
  }
}

export const ingredientMatchingAgent = new IngredientMatchingAgent();
