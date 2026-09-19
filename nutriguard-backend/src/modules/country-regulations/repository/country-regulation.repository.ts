import { eq, asc } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { countries, ingredientCountryRegulations } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';

/**
 * Owns all reads/writes against `countries` and `ingredient_country_regulations`.
 * The Ingredient module intentionally does NOT query these tables directly —
 * it depends on this repository's public methods, keeping the "which
 * ingredient is banned where" concern in exactly one place (Backend Folder
 * Structure §3: Country Regulation Module's public interface).
 */
export class CountryRegulationRepository {
  constructor(private readonly database: Database = db) {}

  async listCountries() {
    try {
      return await this.database.select().from(countries).orderBy(asc(countries.name));
    } catch (err) {
      throw new DatabaseError('Failed to list countries', undefined, err);
    }
  }

  async findByIsoCode(isoCode: string) {
    try {
      const [row] = await this.database.select().from(countries).where(eq(countries.isoCode, isoCode)).limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch country', undefined, err);
    }
  }

  async findRegulationsForIngredient(ingredientId: string) {
    try {
      return await this.database
        .select({ regulation: ingredientCountryRegulations, country: countries })
        .from(ingredientCountryRegulations)
        .innerJoin(countries, eq(ingredientCountryRegulations.countryId, countries.id))
        .where(eq(ingredientCountryRegulations.ingredientId, ingredientId))
        .orderBy(asc(countries.name));
    } catch (err) {
      throw new DatabaseError('Failed to fetch ingredient country regulations', undefined, err);
    }
  }
}

export const countryRegulationRepository = new CountryRegulationRepository();
