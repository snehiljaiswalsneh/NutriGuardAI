import { pgTable, uuid, text, smallint, numeric, timestamp, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { ingredients } from './ingredients.schema.js';
import { userProfiles } from './users.schema.js';

/** Mirrors Database Design Document schema/04_product_module.sql. */
export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
    website: text('website'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ nameUnique: uniqueIndex('brands_name_uk').on(table.name) })
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    barcode: text('barcode'),
    imageUrl: text('image_url'),
    rawIngredientText: text('raw_ingredient_text'),
    createdBy: uuid('created_by').references(() => userProfiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    brandIdIdx: index('idx_products_brand_id').on(table.brandId),
    createdByIdx: index('idx_products_created_by').on(table.createdBy),
    // Partial unique index (only when barcode present) is added via the raw-SQL
    // migration supplement, mirroring the ingredients search_vector pattern —
    // Drizzle's `uniqueIndex` builder has no first-class partial-index `.where()`
    // on all dialects consistently, so see migrations/0002_products_partial_unique.sql
  })
);

export const productIngredients = pgTable(
  'product_ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
    rawText: text('raw_text').notNull(),
    position: smallint('position').notNull().default(0),
    matchConfidence: numeric('match_confidence', { precision: 4, scale: 3 }),
  },
  (table) => ({
    productPositionUnique: uniqueIndex('product_ingredients_uk').on(table.productId, table.position),
    ingredientIdIdx: index('idx_product_ingredients_ingredient_id').on(table.ingredientId),
    confidenceRangeCheck: check(
      'product_ingredients_confidence_range',
      sql`${table.matchConfidence} is null or (${table.matchConfidence} >= 0 and ${table.matchConfidence} <= 1)`
    ),
  })
);

export const brandsRelations = relations(brands, ({ many }) => ({ products: many(products) }));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  ingredients: many(productIngredients),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, { fields: [productIngredients.productId], references: [products.id] }),
  ingredient: one(ingredients, { fields: [productIngredients.ingredientId], references: [ingredients.id] }),
}));

export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductIngredient = typeof productIngredients.$inferSelect;
export type NewProductIngredient = typeof productIngredients.$inferInsert;
