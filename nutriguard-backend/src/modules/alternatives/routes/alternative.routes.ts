import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { optionalAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { alternativeController } from '../controller/alternative.controller.js';
import type { AppEnv } from '@shared/types/hono-env.js';

const ingredientIdParamSchema = z.object({ ingredientId: z.string().uuid() });

/** Mounted at `/ingredients` alongside the Ingredient module's own router (same pattern as country-regulations). */
export const ingredientAlternativeRoutes = new Hono<AppEnv>();

ingredientAlternativeRoutes.get(
  '/:ingredientId/alternatives',
  rateLimitTiers.guest,
  optionalAuth,
  zValidator('param', ingredientIdParamSchema),
  (c) => alternativeController.getForIngredient(c, c.req.valid('param').ingredientId)
);
