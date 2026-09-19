import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { notificationTypeEnum } from './enums.js';
import { userProfiles } from './users.schema.js';

/** Mirrors Database Design Document schema/08_notification_audit_module.sql (`notifications` only — audit_logs is infra-level and out of scope for the application code layer). */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    linkUrl: text('link_url'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userUnreadIdx: index('idx_notifications_user_id_unread').on(table.userId, table.createdAt),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
