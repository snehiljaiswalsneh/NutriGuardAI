import { pgTable, uuid, text, char, timestamp, date, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { regulationStatusEnum } from './enums.js';
import { ingredients } from './ingredients.schema.js';
import { researchSources } from './ingredients.schema.js';

/** Mirrors Database Design Document schema/02_country_module.sql. */
export const countries = pgTable(
  'countries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    isoCode: char('iso_code', { length: 2 }).notNull(),
    isoCode3: char('iso_code_3', { length: 3 }),
    name: text('name').notNull(),
    flagEmoji: text('flag_emoji'),
    region: text('region'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    isoCodeUnique: uniqueIndex('countries_iso_code_uk').on(table.isoCode),
  })
);

/** Mirrors Database Design Document schema/03_ingredient_module.sql (regulation junction). */
export const ingredientCountryRegulations = pgTable(
  'ingredient_country_regulations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'cascade' }),
    status: regulationStatusEnum('status').notNull().default('unregulated'),
    regulationNote: text('regulation_note'),
    effectiveDate: date('effective_date', { mode: 'date' }),
    sourceId: uuid('source_id').references(() => researchSources.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ingredientCountryUnique: uniqueIndex('ingredient_country_regulations_uk').on(table.ingredientId, table.countryId),
    countryIdIdx: index('idx_icr_country_id').on(table.countryId),
    statusIdx: index('idx_icr_status').on(table.status),
  })
);

export const countriesRelations = relations(countries, ({ many }) => ({
  regulations: many(ingredientCountryRegulations),
}));

export const ingredientCountryRegulationsRelations = relations(ingredientCountryRegulations, ({ one }) => ({
  ingredient: one(ingredients, { fields: [ingredientCountryRegulations.ingredientId], references: [ingredients.id] }),
  country: one(countries, { fields: [ingredientCountryRegulations.countryId], references: [countries.id] }),
}));

export type Country = typeof countries.$inferSelect;
export type IngredientCountryRegulation = typeof ingredientCountryRegulations.$inferSelect;
