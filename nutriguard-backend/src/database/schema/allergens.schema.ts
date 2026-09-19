import { pgTable, uuid, text, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { allergenSeverityEnum } from './enums.js';
import { ingredients } from './ingredients.schema.js';

/** Mirrors Database Design Document schema/03_ingredient_module.sql (allergen tables). */
export const allergens = pgTable(
  'allergens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
  },
  (table) => ({
    slugUnique: uniqueIndex('allergens_slug_uk').on(table.slug),
  })
);

export const ingredientAllergens = pgTable(
  'ingredient_allergens',
  {
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    allergenId: uuid('allergen_id')
      .notNull()
      .references(() => allergens.id, { onDelete: 'cascade' }),
    severity: allergenSeverityEnum('severity').notNull().default('moderate'),
    note: text('note'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ingredientId, table.allergenId] }),
    allergenIdIdx: index('idx_ingredient_allergens_allergen_id').on(table.allergenId),
  })
);

export const allergensRelations = relations(allergens, ({ many }) => ({
  ingredientLinks: many(ingredientAllergens),
}));

export const ingredientAllergensRelations = relations(ingredientAllergens, ({ one }) => ({
  ingredient: one(ingredients, { fields: [ingredientAllergens.ingredientId], references: [ingredients.id] }),
  allergen: one(allergens, { fields: [ingredientAllergens.allergenId], references: [allergens.id] }),
}));

export type Allergen = typeof allergens.$inferSelect;
export type IngredientAllergen = typeof ingredientAllergens.$inferSelect;
