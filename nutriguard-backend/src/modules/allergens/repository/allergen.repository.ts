import { eq, inArray } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { allergens, ingredientAllergens } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';

export class AllergenRepository {
  constructor(private readonly database: Database = db) {}

  async findByIngredientId(ingredientId: string) {
    try {
      return await this.database
        .select({ link: ingredientAllergens, allergen: allergens })
        .from(ingredientAllergens)
        .innerJoin(allergens, eq(ingredientAllergens.allergenId, allergens.id))
        .where(eq(ingredientAllergens.ingredientId, ingredientId));
    } catch (err) {
      throw new DatabaseError('Failed to fetch ingredient allergens', undefined, err);
    }
  }

  /** Batch variant used by the Analysis module to detect allergens across a whole scan's ingredient list in one query. */
  async findByIngredientIds(ingredientIds: string[]) {
    if (ingredientIds.length === 0) return [];
    try {
      return await this.database
        .select({ link: ingredientAllergens, allergen: allergens })
        .from(ingredientAllergens)
        .innerJoin(allergens, eq(ingredientAllergens.allergenId, allergens.id))
        .where(inArray(ingredientAllergens.ingredientId, ingredientIds));
    } catch (err) {
      throw new DatabaseError('Failed to batch-fetch ingredient allergens', undefined, err);
    }
  }
}

export const allergenRepository = new AllergenRepository();
