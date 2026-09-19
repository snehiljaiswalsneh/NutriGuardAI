import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ingredientController } from '../controller/ingredient.controller.js';
import { requireAuth, requireRole } from '@middleware/auth.middleware.js';
import { AppRole } from '@shared/constants/index.js';
import { createIngredientSchema, updateIngredientSchema, ingredientIdParamSchema } from '../validator/ingredient.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Mounted at `/admin/ingredients` (API Specification §11). Every route
 * here requires an authenticated admin/super_admin — enforced twice:
 * `requireRole` below (fast-fail at the Edge Function), and Postgres RLS
 * underneath (the real boundary — see Database Design Document §11).
 */
export const adminIngredientRoutes = new Hono<AppEnv>();

const adminOnly = [requireAuth, requireRole(AppRole.ADMIN, AppRole.SUPER_ADMIN)] as const;

adminIngredientRoutes.post('/', ...adminOnly, zValidator('json', createIngredientSchema), (c) =>
  ingredientController.create(c, c.req.valid('json'))
);

adminIngredientRoutes.patch(
  '/:ingredientId',
  ...adminOnly,
  zValidator('param', ingredientIdParamSchema),
  zValidator('json', updateIngredientSchema),
  (c) => ingredientController.update(c, c.req.valid('param').ingredientId, c.req.valid('json'))
);

adminIngredientRoutes.delete('/:ingredientId', ...adminOnly, zValidator('param', ingredientIdParamSchema), (c) =>
  ingredientController.delete(c, c.req.valid('param').ingredientId)
);
