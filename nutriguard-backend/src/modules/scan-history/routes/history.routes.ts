import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { historyController } from '../controller/history.controller.js';
import { historyListQuerySchema, exportQuerySchema } from '../validator/history.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Mounted at `/scans` in app.ts ALONGSIDE the Analysis module's
 * `scanRoutes` (same same-base-path-merge pattern as
 * country-regulations/alternatives/allergens sharing `/ingredients`).
 * IMPORTANT: `/scans/export` must be registered before `scanRoutes`'
 * `/:scanId` in app.ts's mount order is irrelevant to Hono's router
 * (it uses a trie, not first-match-wins for static-vs-param segments —
 * static `/export` always wins over `/:scanId`), but is called out here
 * for readability.
 */
export const historyRoutes = new Hono<AppEnv>();

historyRoutes.get(
  '/',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('query', historyListQuerySchema),
  (c) => historyController.list(c, c.req.valid('query'))
);

historyRoutes.get(
  '/export',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('query', exportQuerySchema),
  (c) => historyController.export(c, c.req.valid('query'))
);
