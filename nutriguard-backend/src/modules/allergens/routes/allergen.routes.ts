import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { optionalAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { allergenController } from '../controller/allergen.controller.js';
import type { AppEnv } from '@shared/types/hono-env.js';

const ingredientIdParamSchema = z.object({ ingredientId: z.string().uuid() });

/** Mounted at `/ingredients` alongside the Ingredient module's own router (same pattern as country-regulations/alternatives). */
export const ingredientAllergenRoutes = new Hono<AppEnv>();

ingredientAllergenRoutes.get(
  '/:ingredientId/allergens',
  rateLimitTiers.guest,
  optionalAuth,
  zValidator('param', ingredientIdParamSchema),
  (c) => allergenController.getForIngredient(c, c.req.valid('param').ingredientId)
);
