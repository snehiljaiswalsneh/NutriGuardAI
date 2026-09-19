import { and, eq, isNull, sql, count, asc, desc } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import {
  ingredients,
  ingredientCategories,
  ingredientHealthEffects,
  ingredientResearchSources,
  researchSources,
} from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';
import type { RiskLevel } from '@shared/constants/index.js';
import type { CreateIngredientInput, UpdateIngredientInput } from '../types/ingredient.types.js';

export interface IngredientSearchFilters {
  q?: string;
  riskLevel?: RiskLevel;
  categoryId?: string;
  page: number;
  limit: number;
  sort?: string;
}

/**
 * The only place in the codebase that queries `ingredients` and its
 * satellite tables directly. Two query strategies are used deliberately:
 *  - `search()` uses raw `sql` for the full-text/trigram OR-match, since
 *    Drizzle's query builder has no first-class tsvector `@@` operator.
 *  - Everything else uses the type-safe query builder.
 */
export class IngredientRepository {
  constructor(private readonly database: Database = db) {}

  async search(filters: IngredientSearchFilters): Promise<{ rows: (typeof ingredients.$inferSelect)[]; total: number }> {
    try {
      const offset = (filters.page - 1) * filters.limit;

      const conditions = [isNull(ingredients.deletedAt)];
      if (filters.riskLevel) conditions.push(eq(ingredients.riskLevel, filters.riskLevel));
      if (filters.categoryId) conditions.push(eq(ingredients.categoryId, filters.categoryId));
      if (filters.q) {
        // Full-text OR trigram-similarity match — matches either a
        // tokenized full-text hit (fast for whole-word queries) or a
        // fuzzy/typo-tolerant trigram similarity above threshold.
        conditions.push(
          sql`(${ingredients.name} % ${filters.q} or search_vector @@ plainto_tsquery('english', ${filters.q}))`
        );
      }

      const whereClause = and(...conditions);

      const orderBy = this.resolveSort(filters.sort);

      const [rows, totalResult] = await Promise.all([
        this.database.select().from(ingredients).where(whereClause).orderBy(orderBy).offset(offset).limit(filters.limit),
        this.database.select({ value: count() }).from(ingredients).where(whereClause),
      ]);

      return { rows, total: totalResult[0]?.value ?? 0 };
    } catch (err) {
      throw new DatabaseError('Failed to search ingredients', undefined, err);
    }
  }

  private resolveSort(sort?: string) {
    if (!sort) return desc(ingredients.createdAt);
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    const direction = descending ? desc : asc;

    switch (field) {
      case 'name':
        return direction(ingredients.name);
      case 'risk_level':
        return direction(ingredients.riskLevel);
      case 'created_at':
      default:
        return direction(ingredients.createdAt);
    }
  }

  async findById(id: string) {
    try {
      const [row] = await this.database
        .select({
          ingredient: ingredients,
          categoryName: ingredientCategories.name,
        })
        .from(ingredients)
        .leftJoin(ingredientCategories, eq(ingredients.categoryId, ingredientCategories.id))
        .where(and(eq(ingredients.id, id), isNull(ingredients.deletedAt)))
        .limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch ingredient', undefined, err);
    }
  }

  async findHealthEffects(ingredientId: string) {
    try {
      return await this.database
        .select()
        .from(ingredientHealthEffects)
        .where(eq(ingredientHealthEffects.ingredientId, ingredientId))
        .orderBy(asc(ingredientHealthEffects.displayOrder));
    } catch (err) {
      throw new DatabaseError('Failed to fetch health effects', undefined, err);
    }
  }

  async findResearchSources(ingredientId: string) {
    try {
      return await this.database
        .select({ source: researchSources })
        .from(ingredientResearchSources)
        .innerJoin(researchSources, eq(ingredientResearchSources.researchSourceId, researchSources.id))
        .where(eq(ingredientResearchSources.ingredientId, ingredientId));
    } catch (err) {
      throw new DatabaseError('Failed to fetch research sources', undefined, err);
    }
  }

  async findCategories() {
    try {
      return await this.database.select().from(ingredientCategories).orderBy(asc(ingredientCategories.name));
    } catch (err) {
      throw new DatabaseError('Failed to fetch ingredient categories', undefined, err);
    }
  }

  async create(input: CreateIngredientInput): Promise<string> {
    try {
      const [row] = await this.database
        .insert(ingredients)
        .values({
          name: input.name,
          scientificName: input.scientificName,
          eNumber: input.eNumber,
          categoryId: input.categoryId,
          riskLevel: input.riskLevel,
          riskSummary: input.riskSummary,
          description: input.description,
          purpose: input.purpose,
          isNatural: input.isNatural ?? false,
          isSynthetic: input.isSynthetic ?? false,
        })
        .returning({ id: ingredients.id });

      if (!row) {
        throw new DatabaseError('Insert did not return an id');
      }
      return row.id;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError('Failed to create ingredient', undefined, err);
    }
  }

  async update(id: string, input: UpdateIngredientInput): Promise<void> {
    try {
      await this.database
        .update(ingredients)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.scientificName !== undefined && { scientificName: input.scientificName }),
          ...(input.eNumber !== undefined && { eNumber: input.eNumber }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.riskLevel !== undefined && { riskLevel: input.riskLevel }),
          ...(input.riskSummary !== undefined && { riskSummary: input.riskSummary }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.purpose !== undefined && { purpose: input.purpose }),
          ...(input.isNatural !== undefined && { isNatural: input.isNatural }),
          ...(input.isSynthetic !== undefined && { isSynthetic: input.isSynthetic }),
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, id));
    } catch (err) {
      throw new DatabaseError('Failed to update ingredient', undefined, err);
    }
  }

  /** Soft delete, per the Database Design Document's retention rule for `ingredients`. */
  async softDelete(id: string): Promise<void> {
    try {
      await this.database.update(ingredients).set({ deletedAt: new Date() }).where(eq(ingredients.id, id));
    } catch (err) {
      throw new DatabaseError('Failed to delete ingredient', undefined, err);
    }
  }
}

export const ingredientRepository = new IngredientRepository();
