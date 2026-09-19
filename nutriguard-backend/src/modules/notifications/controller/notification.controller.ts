import type { Context } from 'hono';
import { notificationService } from '../service/notification.service.js';
import { successResponse, buildPaginationMeta } from '@shared/utils/response.js';
import type { NotificationListQuery } from '../validator/notification.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { TokenInvalidError } from '@shared/errors/app-error.js';

function requireUserId(c: Context<AppEnv>): string {
  const user = c.get('user');
  if (!user) throw new TokenInvalidError('Authentication required');
  return user.id;
}

export class NotificationController {
  async list(c: Context<AppEnv>, query: NotificationListQuery) {
    const userId = requireUserId(c);
    const { rows, total } = await notificationService.list(userId, query.unread_only, query.page, query.limit);
    return c.json(
      successResponse(
        rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link_url: n.linkUrl,
          is_read: n.isRead,
          created_at: n.createdAt,
        })),
        '',
        buildPaginationMeta(query.page, query.limit, total)
      ),
      200
    );
  }

  async markRead(c: Context<AppEnv>, notificationId: string) {
    const userId = requireUserId(c);
    await notificationService.markRead(notificationId, userId);
    return c.json(successResponse({}, 'Notification marked as read'), 200);
  }

  async markAllRead(c: Context<AppEnv>) {
    const userId = requireUserId(c);
    await notificationService.markAllRead(userId);
    return c.json(successResponse({}, 'All notifications marked as read'), 200);
  }

  async delete(c: Context<AppEnv>, notificationId: string) {
    const userId = requireUserId(c);
    await notificationService.delete(notificationId, userId);
    return c.body(null, 204);
  }
}

export const notificationController = new NotificationController();
