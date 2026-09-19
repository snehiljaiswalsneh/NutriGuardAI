import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, requireRole } from '@middleware/auth.middleware.js';
import { AppRole } from '@shared/constants/index.js';
import { adminController } from '../controller/admin.controller.js';
import { dashboardMetricsQuerySchema, userListQuerySchema } from '../validator/admin.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Mounted at `/admin` — API Specification §11. Ingredient management
 * (`/admin/ingredients`) already exists from Phase 4
 * (`@modules/ingredients`'s `adminIngredientRoutes`) and is mounted
 * separately in app.ts — not duplicated here.
 */
export const adminRoutes = new Hono<AppEnv>();

const adminOnly = [requireAuth, requireRole(AppRole.ADMIN, AppRole.SUPER_ADMIN)] as const;

adminRoutes.get(
  '/dashboard/metrics',
  ...adminOnly,
  zValidator('query', dashboardMetricsQuerySchema),
  (c) => adminController.getDashboardMetrics(c, c.req.valid('query'))
);

adminRoutes.get(
  '/users',
  ...adminOnly,
  zValidator('query', userListQuerySchema),
  (c) => adminController.listUsers(c, c.req.valid('query'))
);
