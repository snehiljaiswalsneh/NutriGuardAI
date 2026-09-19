import { pgTable, uuid, text, boolean, timestamp, smallint, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { riskLevelEnum } from './enums.js';

/**
 * Mirrors Database Design Document schema/03_ingredient_module.sql.
 *
 * NOTE on full-text search: the DDD's `ingredients.search_vector`
 * generated/stored tsvector column and its GIN index are NOT modeled
 * here as Drizzle columns — Drizzle's generated-column support for
 * `tsvector` requires a raw SQL customType with no meaningful type
 * safety benefit. Instead, `search_vector` and its GIN index are created
 * by a raw-SQL migration supplement (see
 * `src/database/migrations/0001_ingredient_search_vector.sql`, applied
 * immediately after the Drizzle-generated migration for this table), and
 * the repository queries it directly via `sql` template literals
 * (see `ingredient.repository.ts` → `search()`).
 */

export const ingredientCategories = pgTable('ingredient_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugUnique: uniqueIndex('ingredient_categories_slug_uk').on(table.slug),
  parentIdIdx: index('idx_ingredient_categories_parent_id').on(table.parentId),
}));

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => ingredientCategories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  scientificName: text('scientific_name'),
  eNumber: text('e_number'),
  aliases: text('aliases').array().notNull().default(sql`'{}'::text[]`),
  description: text('description'),
  purpose: text('purpose'),
  riskLevel: riskLevelEnum('risk_level').notNull().default('unknown'),
  riskSummary: text('risk_summary'),
  isNatural: boolean('is_natural').notNull().default(false),
  isSynthetic: boolean('is_synthetic').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  nameUnique: uniqueIndex('ingredients_name_uk').on(table.name),
  categoryIdIdx: index('idx_ingredients_category_id').on(table.categoryId),
  riskLevelIdx: index('idx_ingredients_risk_level').on(table.riskLevel),
}));

export const ingredientHealthEffects = pgTable('ingredient_health_effects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  effect: text('effect').notNull(),
  severity: riskLevelEnum('severity').notNull().default('unknown'),
  displayOrder: smallint('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ingredientIdIdx: index('idx_ingredient_health_effects_ingredient_id').on(table.ingredientId),
}));

export const researchSources = pgTable('research_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  publisher: text('publisher'),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  urlUnique: uniqueIndex('research_sources_url_uk').on(table.url),
}));

export const ingredientResearchSources = pgTable('ingredient_research_sources', {
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  researchSourceId: uuid('research_source_id').notNull().references(() => researchSources.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.ingredientId, table.researchSourceId] }),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  category: one(ingredientCategories, {
    fields: [ingredients.categoryId],
    references: [ingredientCategories.id],
  }),
  healthEffects: many(ingredientHealthEffects),
  researchSources: many(ingredientResearchSources),
}));

export const ingredientHealthEffectsRelations = relations(ingredientHealthEffects, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientHealthEffects.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ingredientResearchSourcesRelations = relations(ingredientResearchSources, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientResearchSources.ingredientId],
    references: [ingredients.id],
  }),
  source: one(researchSources, {
    fields: [ingredientResearchSources.researchSourceId],
    references: [researchSources.id],
  }),
}));

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type IngredientCategory = typeof ingredientCategories.$inferSelect;
export type IngredientHealthEffect = typeof ingredientHealthEffects.$inferSelect;
export type ResearchSource = typeof researchSources.$inferSelect;
