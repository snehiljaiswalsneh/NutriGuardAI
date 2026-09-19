import { eq } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { products, brands, productIngredients, ingredients } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';
import type { NewProduct, NewProductIngredient } from '@database/schema/index.js';

export class ProductRepository {
  constructor(private readonly database: Database = db) {}

  async findOrCreateBrand(brandName: string): Promise<string | null> {
    if (!brandName?.trim()) return null;
    try {
      const [existing] = await this.database.select().from(brands).where(eq(brands.name, brandName)).limit(1);
      if (existing) return existing.id;

      const [created] = await this.database.insert(brands).values({ name: brandName }).returning({ id: brands.id });
      return created?.id ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to find or create brand', undefined, err);
    }
  }

  async create(input: NewProduct): Promise<string> {
    try {
      const [row] = await this.database.insert(products).values(input).returning({ id: products.id });
      if (!row) throw new DatabaseError('Product insert did not return an id');
      return row.id;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError('Failed to create product', undefined, err);
    }
  }

  async findById(id: string) {
    try {
      const [row] = await this.database
        .select({ product: products, brand: brands })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(eq(products.id, id))
        .limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch product', undefined, err);
    }
  }

  async saveProductIngredients(rows: NewProductIngredient[]): Promise<void> {
    if (rows.length === 0) return;
    try {
      await this.database.insert(productIngredients).values(rows);
    } catch (err) {
      throw new DatabaseError('Failed to save product ingredients', undefined, err);
    }
  }

  /** Ordered ingredient breakdown for the Dashboard's ingredient table. */
  async findIngredientBreakdown(productId: string) {
    try {
      return await this.database
        .select({ productIngredient: productIngredients, ingredient: ingredients })
        .from(productIngredients)
        .leftJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
        .where(eq(productIngredients.productId, productId))
        .orderBy(productIngredients.position);
    } catch (err) {
      throw new DatabaseError('Failed to fetch product ingredient breakdown', undefined, err);
    }
  }
}

export const productRepository = new ProductRepository();
