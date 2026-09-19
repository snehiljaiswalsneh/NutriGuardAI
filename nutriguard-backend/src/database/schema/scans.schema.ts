import { pgTable, uuid, text, smallint, integer, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { jobStatusEnum, riskLevelEnum, comparisonWinnerEnum, inputSourceEnum } from './enums.js';
import { products } from './products.schema.js';
import { userProfiles } from './users.schema.js';

/** Mirrors Database Design Document schema/06_history_module.sql. */
export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    status: jobStatusEnum('status').notNull().default('pending'),
    aiModelVersion: text('ai_model_version').notNull().default('ai-analyzer-v1'),
    inputSource: inputSourceEnum('input_source').notNull().default('paste'),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
    errorMessage: text('error_message'),
  },
  (table) => ({
    userScannedAtIdx: index('idx_scans_user_id_scanned_at').on(table.userId, table.scannedAt),
    productIdIdx: index('idx_scans_product_id').on(table.productId),
    errorOnlyWhenFailedCheck: check(
      'scans_error_only_when_failed',
      sql`(${table.status} = 'failed' and ${table.errorMessage} is not null) or (${table.status} <> 'failed')`
    ),
  })
);

export const safetyScores = pgTable(
  'safety_scores',
  {
    scanId: uuid('scan_id')
      .primaryKey()
      .references(() => scans.id, { onDelete: 'cascade' }),
    score: smallint('score').notNull(),
    verdict: riskLevelEnum('verdict').notNull(),
    ingredientCount: smallint('ingredient_count').notNull().default(0),
    flaggedCount: smallint('flagged_count').notNull().default(0),
    scoringVersion: text('scoring_version').notNull().default('v1'),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    scoreRangeCheck: check('safety_scores_score_range', sql`${table.score} between 0 and 100`),
  })
);

export const aiSummaries = pgTable('ai_summaries', {
  scanId: uuid('scan_id')
    .primaryKey()
    .references(() => scans.id, { onDelete: 'cascade' }),
  summaryText: text('summary_text').notNull(),
  allergyWarning: text('allergy_warning'),
  modelName: text('model_name').notNull().default('claude-sonnet-5'),
  promptVersion: text('prompt_version').notNull().default('v1'),
  tokenCount: integer('token_count'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comparisons = pgTable(
  'comparisons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    scanAId: uuid('scan_a_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    scanBId: uuid('scan_b_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    winner: comparisonWinnerEnum('winner').notNull(),
    recommendationText: text('recommendation_text').notNull(),
    comparedAt: timestamp('compared_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userComparedAtIdx: index('idx_comparisons_user_id_compared_at').on(table.userId, table.comparedAt),
    scanAIdIdx: index('idx_comparisons_scan_a_id').on(table.scanAId),
    scanBIdIdx: index('idx_comparisons_scan_b_id').on(table.scanBId),
    distinctScansCheck: check('comparisons_distinct_scans', sql`${table.scanAId} <> ${table.scanBId}`),
  })
);

export const scansRelations = relations(scans, ({ one }) => ({
  product: one(products, { fields: [scans.productId], references: [products.id] }),
  user: one(userProfiles, { fields: [scans.userId], references: [userProfiles.id] }),
  safetyScore: one(safetyScores, { fields: [scans.id], references: [safetyScores.scanId] }),
  aiSummary: one(aiSummaries, { fields: [scans.id], references: [aiSummaries.scanId] }),
}));

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type SafetyScore = typeof safetyScores.$inferSelect;
export type NewSafetyScore = typeof safetyScores.$inferInsert;
export type AiSummary = typeof aiSummaries.$inferSelect;
export type NewAiSummary = typeof aiSummaries.$inferInsert;
export type Comparison = typeof comparisons.$inferSelect;
export type NewComparison = typeof comparisons.$inferInsert;
