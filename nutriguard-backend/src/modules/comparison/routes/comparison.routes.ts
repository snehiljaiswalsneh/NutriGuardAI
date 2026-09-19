import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { comparisonController } from '../controller/comparison.controller.js';
import { createComparisonSchema, comparisonIdParamSchema, comparisonListQuerySchema } from '../validator/comparison.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/** Mounted at `/comparisons` — API Specification §7. */
export const comparisonRoutes = new Hono<AppEnv>();

comparisonRoutes.post(
  '/',
  requireAuth,
  rateLimitTiers.aiCompute,
  zValidator('json', createComparisonSchema),
  (c) => comparisonController.create(c, c.req.valid('json'))
);

comparisonRoutes.get(
  '/',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('query', comparisonListQuerySchema),
  (c) => comparisonController.list(c, c.req.valid('query'))
);

comparisonRoutes.get(
  '/:comparisonId',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', comparisonIdParamSchema),
  (c) => comparisonController.getById(c, c.req.valid('param').comparisonId)
);

comparisonRoutes.delete(
  '/:comparisonId',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', comparisonIdParamSchema),
  (c) => comparisonController.delete(c, c.req.valid('param').comparisonId)
);
