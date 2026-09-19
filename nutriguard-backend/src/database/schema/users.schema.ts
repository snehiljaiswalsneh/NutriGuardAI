import { pgTable, uuid, text, boolean, timestamp, char, pgSchema } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { appRoleEnum } from './enums.js';

/**
 * `auth.users` is managed entirely by Supabase Auth — we never migrate it
 * ourselves, only reference it. Declaring it here (schema-qualified, no
 * columns beyond the PK) lets Drizzle type the foreign key on
 * `userProfiles.id` correctly without Drizzle attempting to manage the
 * `auth` schema's lifecycle.
 */
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

/**
 * One-to-one extension of auth.users — see Database Design Document
 * schema/01_auth_module.sql for the authoritative column list/constraints.
 * This Drizzle table MUST stay in sync with that SQL; migrations are
 * generated from this file via `npm run db:generate`.
 */
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: appRoleEnum('role').notNull().default('user'),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  countryCode: char('country_code', { length: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  theme: text('theme', { enum: ['light', 'dark', 'system'] })
    .notNull()
    .default('light'),
  languageCode: char('language_code', { length: 5 }).notNull().default('en'),
  notifyScanComplete: boolean('notify_scan_complete').notNull().default(true),
  notifyWeeklyDigest: boolean('notify_weekly_digest').notNull().default(false),
  notifyNewBanAlert: boolean('notify_new_ban_alert').notNull().default(true),
  marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
  dataSharingOptIn: boolean('data_sharing_opt_in').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  settings: one(userSettings, {
    fields: [userProfiles.id],
    references: [userSettings.userId],
  }),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
