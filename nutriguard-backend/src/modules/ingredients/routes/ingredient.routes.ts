import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ingredientController } from '../controller/ingredient.controller.js';
import { optionalAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { ingredientSearchQuerySchema, ingredientIdParamSchema } from '../validator/ingredient.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { ValidationError } from '@shared/errors/app-error.js';

/**
 * Public read routes — no auth required (API Specification §4 marks
 * every one of these `security: []`). `optionalAuth` is still applied so
 * a logged-in user's request is attributed in logs/rate-limit buckets
 * without requiring a token.
 */
export const ingredientRoutes = new Hono<AppEnv>();

ingredientRoutes.get(
  '/',
  rateLimitTiers.guest,
  optionalAuth,
  zValidator('query', ingredientSearchQuerySchema, (result, _c) => {
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message ?? 'Invalid query parameters');
    }
  }),
  (c) => ingredientController.search(c, c.req.valid('query'))
);

ingredientRoutes.get('/:ingredientId', optionalAuth, zValidator('param', ingredientIdParamSchema), (c) =>
  ingredientController.getById(c, c.req.valid('param').ingredientId)
);

ingredientRoutes.get('/:ingredientId/health-effects', optionalAuth, zValidator('param', ingredientIdParamSchema), (c) =>
  ingredientController.getHealthEffects(c, c.req.valid('param').ingredientId)
);
