import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { optionalAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { countryRegulationController } from '../controller/country-regulation.controller.js';
import { ingredientIdParamSchema, regulationQuerySchema } from '../validator/country-regulation.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Mounted at `/ingredients` alongside (not instead of) the Ingredient
 * module's own router — Hono allows two routers to share a base path as
 * long as the sub-paths don't collide. This keeps the "country
 * regulation" concern owned by this module (Backend Folder Structure
 * §3), while still satisfying the API Specification's URL shape
 * (`GET /ingredients/{ingredientId}/regulations`).
 */
export const ingredientRegulationRoutes = new Hono<AppEnv>();

ingredientRegulationRoutes.get(
  '/:ingredientId/regulations',
  rateLimitTiers.guest,
  optionalAuth,
  zValidator('param', ingredientIdParamSchema),
  zValidator('query', regulationQuerySchema),
  (c) => countryRegulationController.getIngredientRegulations(c, c.req.valid('param').ingredientId, c.req.valid('query'))
);
