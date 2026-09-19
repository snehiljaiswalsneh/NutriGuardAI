import { cors } from 'hono/cors';
import { corsAllowedOrigins } from '@shared/config/env.js';

/**
 * Strict allow-list CORS (API Specification §18) — never wildcard `*`,
 * since requests carry credentials (Authorization header). Origins come
 * from CORS_ALLOWED_ORIGINS (comma-separated) so staging/preview domains
 * can be added without a code change.
 */
export const corsMiddleware = cors({
  origin: corsAllowedOrigins,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposeHeaders: ['X-Request-Id', 'Retry-After'],
  credentials: true,
  maxAge: 600,
});
