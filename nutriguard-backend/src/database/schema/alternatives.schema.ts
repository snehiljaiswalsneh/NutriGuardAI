import { pgTable, uuid, text, smallint, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { ingredients } from './ingredients.schema.js';

/** Mirrors Database Design Document schema/03_ingredient_module.sql (`ingredient_alternatives`). */
export const ingredientAlternatives = pgTable(
  'ingredient_alternatives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    alternativeIngredientId: uuid('alternative_ingredient_id').references(() => ingredients.id, { onDelete: 'set null' }),
    altProductName: text('alt_product_name'),
    reason: text('reason').notNull(),
    scoreDelta: smallint('score_delta').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ingredientIdIdx: index('idx_ingredient_alternatives_ingredient_id').on(table.ingredientId),
    altIngredientIdIdx: index('idx_ingredient_alternatives_alt_ingredient_id').on(table.alternativeIngredientId),
    targetPresentCheck: check(
      'ingredient_alternatives_target_present',
      sql`${table.alternativeIngredientId} is not null or ${table.altProductName} is not null`
    ),
  })
);

export const ingredientAlternativesRelations = relations(ingredientAlternatives, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientAlternatives.ingredientId],
    references: [ingredients.id],
    relationName: 'sourceIngredient',
  }),
  alternativeIngredient: one(ingredients, {
    fields: [ingredientAlternatives.alternativeIngredientId],
    references: [ingredients.id],
    relationName: 'alternativeIngredient',
  }),
}));

export type IngredientAlternative = typeof ingredientAlternatives.$inferSelect;
