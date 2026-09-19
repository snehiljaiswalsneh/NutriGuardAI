import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { analysisController } from '../controller/analysis.controller.js';
import { triggerAnalysisSchema, scanIdParamSchema } from '../validator/analysis.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

import { liveAnalysisService } from '../service/live-analysis.service.js';
import { successResponse } from '@shared/utils/response.js';

/** Mounted at `/analysis` — API Specification §5. */
export const analysisRoutes = new Hono<AppEnv>();

analysisRoutes.post(
  '/',
  requireAuth,
  rateLimitTiers.aiCompute,
  zValidator('json', triggerAnalysisSchema),
  (c) => analysisController.trigger(c, c.req.valid('json'))
);

/** Live AI analysis route for dynamic client input (e.g. testing ingredients without DB dependencies) */
analysisRoutes.post('/live', async (c) => {
  const body = await c.req.json();
  const result = await liveAnalysisService.analyze(body);
  return c.json(successResponse(result));
});

/** Return all persistently stored scans */
analysisRoutes.get('/history', async (c) => {
  const scans = liveAnalysisService.getAllScans();
  return c.json(successResponse(scans));
});

/** Delete a specific scan by ID */
analysisRoutes.delete('/history/:scanId', async (c) => {
  const scanId = c.req.param('scanId');
  const deleted = liveAnalysisService.deleteScan(scanId);
  return c.json(successResponse({ deleted, scanId }));
});

/** Clear all scans */
analysisRoutes.delete('/history', async (c) => {
  liveAnalysisService.clearAllScans();
  return c.json(successResponse({ cleared: true }));
});

/** Mounted at `/scans` — shared by Analysis (§5) and History (§8) per the API Specification. */
export const scanRoutes = new Hono<AppEnv>();

scanRoutes.get(
  '/:scanId',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.getDashboard(c, c.req.valid('param').scanId)
);

scanRoutes.delete(
  '/:scanId',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.deleteScan(c, c.req.valid('param').scanId)
);

scanRoutes.get(
  '/:scanId/safety-score',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.getSafetyScore(c, c.req.valid('param').scanId)
);

scanRoutes.get(
  '/:scanId/ai-summary',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.getAiSummary(c, c.req.valid('param').scanId)
);

scanRoutes.get(
  '/:scanId/recommendations',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.getRecommendations(c, c.req.valid('param').scanId)
);

scanRoutes.get(
  '/:scanId/consumption-advice',
  requireAuth,
  rateLimitTiers.authenticated,
  zValidator('param', scanIdParamSchema),
  (c) => analysisController.getConsumptionAdvice(c, c.req.valid('param').scanId)
);
