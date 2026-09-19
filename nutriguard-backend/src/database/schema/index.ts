/**
 * Barrel export for the full Drizzle schema. Every new table file
 * (ingredients.schema.ts, products.schema.ts, scans.schema.ts, ...) gets
 * added here as its module is implemented in a later phase — see the
 * Database Design Document for the complete 38-table target schema this
 * is incrementally building toward.
 */
export * from './enums.js';
export * from './users.schema.js';
export * from './ingredients.schema.js';
export * from './countries.schema.js';
export * from './allergens.schema.js';
export * from './alternatives.schema.js';
export * from './products.schema.js';
export * from './scans.schema.js';
export * from './notifications.schema.js';
