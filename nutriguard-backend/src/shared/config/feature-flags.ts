import { env } from './env.js';

/**
 * Centralized feature-flag lookup. Modules should check these rather than
 * reading `process.env` directly, so toggling a future feature (OCR,
 * Barcode, Voice Assistant) is a one-line change and easy to unit test
 * (mock this module) without touching env-parsing logic.
 */
export const featureFlags = {
  ocrScanner: env.FEATURE_OCR_ENABLED,
  barcodeScanner: env.FEATURE_BARCODE_ENABLED,
  voiceAssistant: env.FEATURE_VOICE_ENABLED,
} as const;

export type FeatureFlags = typeof featureFlags;
