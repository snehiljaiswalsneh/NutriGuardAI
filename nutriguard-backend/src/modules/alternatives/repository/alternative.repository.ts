import { eq, desc } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { ingredientAlternatives, ingredients } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';
import { alias } from 'drizzle-orm/pg-core';

const alternativeIngredient = alias(ingredients, 'alternative_ingredient');

export class AlternativeRepository {
  constructor(private readonly database: Database = db) {}

  /** Ranked by scoreDelta descending — the biggest safety-score improvement first. */
  async findByIngredientId(ingredientId: string) {
    try {
      return await this.database
        .select({ alternative: ingredientAlternatives, alternativeIngredient })
        .from(ingredientAlternatives)
        .leftJoin(alternativeIngredient, eq(ingredientAlternatives.alternativeIngredientId, alternativeIngredient.id))
        .where(eq(ingredientAlternatives.ingredientId, ingredientId))
        .orderBy(desc(ingredientAlternatives.scoreDelta));
    } catch (err) {
      throw new DatabaseError('Failed to fetch ingredient alternatives', undefined, err);
    }
  }
}

export const alternativeRepository = new AlternativeRepository();
