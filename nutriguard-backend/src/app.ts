import { Hono } from 'hono';
import { env } from '@shared/config/env.js';
import { requestIdMiddleware } from '@middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from '@middleware/request-logger.middleware.js';
import { securityHeadersMiddleware } from '@middleware/security-headers.middleware.js';
import { corsMiddleware } from '@middleware/cors.middleware.js';
import { globalErrorHandler } from '@middleware/error-handler.middleware.js';
import { healthRoutes } from '@modules/health/index.js';
import { authRoutes } from '@modules/auth/index.js';
import { ingredientRoutes, ingredientCategoryRoutes, adminIngredientRoutes } from '@modules/ingredients/index.js';
import { countryRoutes, ingredientRegulationRoutes } from '@modules/country-regulations/index.js';
import { ingredientAlternativeRoutes } from '@modules/alternatives/index.js';
import { ingredientAllergenRoutes } from '@modules/allergens/index.js';
import { analysisRoutes, scanRoutes } from '@modules/analysis/index.js';
import { comparisonRoutes } from '@modules/comparison/index.js';
import { historyRoutes } from '@modules/scan-history/index.js';
import { notificationRoutes } from '@modules/notifications/index.js';
import { adminRoutes } from '@modules/admin/index.js';
import { ocrRoutes } from '@modules/ocr/index.js';
import { barcodeRoutes } from '@modules/barcode/index.js';
import { voiceRoutes } from '@modules/voice/index.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Root Hono application. Middleware order matters:
 *   1. requestId — every subsequent log line (including error logs) needs it
 *   2. securityHeaders / cors — applied before any handler runs
 *   3. requestLogger — wraps `next()` so it can log the final status/duration
 *   4. (route-level) requireAuth / rateLimit / zValidator — per-route as needed
 *   5. onError — catches anything thrown anywhere above
 *
 * New modules (products, ingredients, analysis, ...) are added below in
 * later phases by importing their routes and `app.route(...)`-mounting
 * them here — this file should never contain business logic itself.
 */
export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use('*', requestIdMiddleware);
  app.use('*', securityHeadersMiddleware);
  app.use('*', corsMiddleware);
  app.use('*', requestLoggerMiddleware);

  app.onError(globalErrorHandler);

  app.notFound((c) => {
    return c.json(
      {
        success: false,
        message: 'Route not found',
        data: {},
        meta: {},
        errors: [{ code: 'NOT_FOUND', field: null, message: `No route matches ${c.req.method} ${c.req.path}` }],
      },
      404
    );
  });

  const api = new Hono<AppEnv>();
  api.route('/health', healthRoutes);
  api.route('/auth', authRoutes);

  // Ingredients + everything mounted alongside it at the same base path
  // (country regulations, alternatives, allergens each own one narrow
  // slice of `/ingredients/{id}/*` — see each module's routes file for
  // why they're separate routers rather than folded into the Ingredient
  // module itself).
  api.route('/ingredients', ingredientRoutes);
  api.route('/ingredients', ingredientRegulationRoutes);
  api.route('/ingredients', ingredientAlternativeRoutes);
  api.route('/ingredients', ingredientAllergenRoutes);
  api.route('/ingredient-categories', ingredientCategoryRoutes);
  api.route('/countries', countryRoutes);

  api.route('/analysis', analysisRoutes);
  // `/scans` is shared by the Analysis module (single-scan reads,
  // safety-score/ai-summary/recommendations/consumption-advice,
  // delete) and the History module (list + export) — same
  // same-base-path-merge pattern as `/ingredients` above.
  api.route('/scans', scanRoutes);
  api.route('/scans', historyRoutes);

  api.route('/comparisons', comparisonRoutes);
  api.route('/notifications', notificationRoutes);

  api.route('/admin/ingredients', adminIngredientRoutes);
  api.route('/admin', adminRoutes);

  // Future features — routes exist at their final shape now, return 501
  // until each FEATURE_*_ENABLED flag flips (see @shared/config/env.ts
  // and each stub route's own comment).
  api.route('/products/ocr-upload', ocrRoutes);
  api.route('/products/barcode', barcodeRoutes);
  api.route('/ai/voice-query', voiceRoutes);

  app.route(env.API_BASE_PATH, api);

  return app;
}
