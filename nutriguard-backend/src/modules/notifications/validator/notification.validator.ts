import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '@shared/constants/index.js';

export const notificationListQuerySchema = z.object({
  unread_only: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid(),
});
