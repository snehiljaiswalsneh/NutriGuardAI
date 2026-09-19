import { createMiddleware } from 'hono/factory';
import { nanoid } from 'nanoid';
import { HEADER } from '@shared/constants/index.js';
import { createRequestLogger } from '@shared/logger/logger.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Generates (or forwards, if the client/load-balancer already set one) a
 * unique request ID, attaches it to the response header and to context,
 * and creates a request-scoped child logger every downstream handler uses
 * instead of the raw root logger — this is what makes `X-Request-Id`
 * traceable end-to-end in logs (API Specification §27 Observability).
 */
export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const requestId = c.req.header(HEADER.REQUEST_ID) ?? nanoid();
  c.set('requestId', requestId);
  c.set('logger', createRequestLogger(requestId));
  c.header(HEADER.REQUEST_ID, requestId);
  await next();
});
