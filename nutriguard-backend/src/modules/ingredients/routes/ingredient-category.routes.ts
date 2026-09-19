import { Hono } from 'hono';
import { ingredientController } from '../controller/ingredient.controller.js';
import { optionalAuth } from '@middleware/auth.middleware.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/** Mounted at `/ingredient-categories` (API Specification §4). */
export const ingredientCategoryRoutes = new Hono<AppEnv>();

ingredientCategoryRoutes.get('/', optionalAuth, (c) => ingredientController.listCategories(c));
