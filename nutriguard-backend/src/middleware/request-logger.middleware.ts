import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Logs one structured line per completed request: method, path, status,
 * duration, and (if authenticated) the user ID — the "Request Logs"
 * category from the API Specification §27 Observability section.
 */
export const requestLoggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const start = performance.now();
  await next();
  const durationMs = Math.round(performance.now() - start);
  const logger = c.get('logger');

  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
      userId: c.get('user')?.id,
    },
    'request completed'
  );
});
