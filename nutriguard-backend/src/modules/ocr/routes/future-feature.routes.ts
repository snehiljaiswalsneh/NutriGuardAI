import { Hono } from 'hono';
import { requireAuth } from '@middleware/auth.middleware.js';
import { env } from '@shared/config/env.js';
import { successResponse } from '@shared/utils/response.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Future-feature placeholders (AI Agent LLD §27 Future Scalability /
 * API Specification §6, §20). Each route already exists at its final
 * URL shape and is gated by an `env.FEATURE_*_ENABLED` flag — flipping
 * the flag and implementing the handler body is the ONLY change needed
 * to ship the feature; no route restructuring, matching the "backend
 * structure must accommodate future features without major
 * restructuring" requirement.
 */
export const ocrRoutes = new Hono<AppEnv>();

ocrRoutes.post('/', requireAuth, (c) => {
  if (!env.FEATURE_OCR_ENABLED) {
    return c.json(
      { success: false, message: 'OCR Scanner is not yet available', data: {}, meta: {}, errors: [{ code: 'NOT_IMPLEMENTED', field: null, message: 'This feature is planned but not yet enabled.' }] },
      501
    );
  }
  // Real implementation lands here once FEATURE_OCR_ENABLED flips true:
  // accept multipart image -> Supabase Storage -> OCR provider -> feed
  // extracted text into AnalysisWorkflow the same way `paste` input does.
  return c.json(successResponse({}), 202);
});

export const barcodeRoutes = new Hono<AppEnv>();

barcodeRoutes.get('/:barcode', (c) => {
  if (!env.FEATURE_BARCODE_ENABLED) {
    return c.json(
      { success: false, message: 'Barcode Scanner is not yet available', data: {}, meta: {}, errors: [{ code: 'NOT_IMPLEMENTED', field: null, message: 'This feature is planned but not yet enabled.' }] },
      501
    );
  }
  return c.json(successResponse({}), 200);
});

export const voiceRoutes = new Hono<AppEnv>();

voiceRoutes.post('/', requireAuth, (c) => {
  if (!env.FEATURE_VOICE_ENABLED) {
    return c.json(
      { success: false, message: 'Voice Assistant is not yet available', data: {}, meta: {}, errors: [{ code: 'NOT_IMPLEMENTED', field: null, message: 'This feature is planned but not yet enabled.' }] },
      501
    );
  }
  return c.json(successResponse({}), 200);
});
