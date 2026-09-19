import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { notificationController } from '../controller/notification.controller.js';
import { notificationListQuerySchema, notificationIdParamSchema } from '../validator/notification.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/** Mounted at `/notifications` — API Specification §10. */
export const notificationRoutes = new Hono<AppEnv>();

notificationRoutes.get(
  '/',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('query', notificationListQuerySchema),
  (c) => notificationController.list(c, c.req.valid('query'))
);

notificationRoutes.patch('/read-all', requireAuth, rateLimitTiers.authenticated, (c) => notificationController.markAllRead(c));

notificationRoutes.patch(
  '/:notificationId/read',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', notificationIdParamSchema),
  (c) => notificationController.markRead(c, c.req.valid('param').notificationId)
);

notificationRoutes.delete(
  '/:notificationId',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', notificationIdParamSchema),
  (c) => notificationController.delete(c, c.req.valid('param').notificationId)
);
