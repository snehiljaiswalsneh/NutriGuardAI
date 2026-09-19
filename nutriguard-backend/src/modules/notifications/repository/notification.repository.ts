import { eq, and, desc, count } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { notifications } from '@database/schema/index.js';
import { DatabaseError, NotFoundError, ForbiddenError } from '@shared/errors/app-error.js';

export class NotificationRepository {
  constructor(private readonly database: Database = db) {}

  async list(userId: string, unreadOnly: boolean, page: number, limit: number) {
    try {
      const conditions = unreadOnly ? and(eq(notifications.userId, userId), eq(notifications.isRead, false)) : eq(notifications.userId, userId);

      const [rows, totalResult] = await Promise.all([
        this.database
          .select()
          .from(notifications)
          .where(conditions)
          .orderBy(desc(notifications.createdAt))
          .limit(limit)
          .offset((page - 1) * limit),
        this.database.select({ value: count() }).from(notifications).where(conditions),
      ]);

      return { rows, total: totalResult[0]?.value ?? 0 };
    } catch (err) {
      throw new DatabaseError('Failed to list notifications', undefined, err);
    }
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    try {
      const [existing] = await this.database.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1);
      if (!existing) throw new NotFoundError('Notification', notificationId);
      if (existing.userId !== userId) throw new ForbiddenError('You do not have access to this notification');

      await this.database.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
      throw new DatabaseError('Failed to mark notification as read', undefined, err);
    }
  }

  async markAllRead(userId: string): Promise<void> {
    try {
      await this.database.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    } catch (err) {
      throw new DatabaseError('Failed to mark all notifications as read', undefined, err);
    }
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    try {
      const [existing] = await this.database.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1);
      if (!existing) throw new NotFoundError('Notification', notificationId);
      if (existing.userId !== userId) throw new ForbiddenError('You do not have access to this notification');

      await this.database.delete(notifications).where(eq(notifications.id, notificationId));
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
      throw new DatabaseError('Failed to delete notification', undefined, err);
    }
  }

  /** Called by other modules (e.g. Analysis, on scan completion) — never by a route directly. */
  async create(input: { userId: string; type: string; title: string; body?: string; linkUrl?: string }): Promise<void> {
    try {
      await this.database.insert(notifications).values({
        userId: input.userId,
        type: input.type as 'scan_complete' | 'weekly_digest' | 'new_ban_alert' | 'system' | 'marketing',
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl,
      });
    } catch (err) {
      throw new DatabaseError('Failed to create notification', undefined, err);
    }
  }
}

export const notificationRepository = new NotificationRepository();
