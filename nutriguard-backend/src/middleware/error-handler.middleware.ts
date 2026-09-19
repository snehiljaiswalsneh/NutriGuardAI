import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { AppError, RateLimitError } from '@shared/errors/app-error.js';
import { errorResponse, type ErrorDetail } from '@shared/utils/response.js';
import { HEADER } from '@shared/constants/index.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { logger as rootLogger } from '@shared/logger/logger.js';

/**
 * Single place every thrown error passes through before becoming an HTTP
 * response. Registered once via `app.onError(globalErrorHandler)` in
 * app.ts. Guarantees the API Specification §13/§14 contract holds for
 * every route, even ones that forgot to handle a specific error type
 * themselves.
 */
export function globalErrorHandler(err: Error, c: Context<AppEnv>): Response {
  const log = c.get('logger') ?? rootLogger;

  // 1. Our own operational errors — expected, already have a status/code.
  if (err instanceof AppError) {
    log.warn({ err, code: err.code }, 'operational error');
    const headers: Record<string, string> = {};
    if (err instanceof RateLimitError) {
      headers[HEADER.RETRY_AFTER] = String(err.retryAfterSeconds);
    }
    return c.json(errorResponse(err.message, [err.toErrorDetail()]), err.statusCode as ContentfulStatusCode, headers);
  }

  // 2. Zod validation errors thrown directly (rare — normally caught by
  //    the zValidator middleware itself, but defended here too).
  if (err instanceof ZodError) {
    const errors: ErrorDetail[] = err.errors.map((e) => ({
      code: 'VALIDATION_ERROR',
      field: e.path.join('.'),
      message: e.message,
    }));
    log.info({ errors }, 'validation error');
    return c.json(errorResponse('Validation failed', errors), 422);
  }

  // 3. Hono's own HTTPException (e.g. thrown by built-in middleware).
  if (err instanceof HTTPException) {
    log.warn({ err }, 'http exception');
    return c.json(
      errorResponse(err.message || 'Request failed', [{ code: 'HTTP_EXCEPTION', field: null, message: err.message }]),
      err.status
    );
  }

  // 4. Anything else is an unexpected bug — log with full stack, never
  //    leak internal details to the client.
  log.error({ err }, 'unhandled error');
  return c.json(
    errorResponse('An unexpected error occurred', [{ code: 'INTERNAL_ERROR', field: null, message: 'Internal server error' }]),
    500
  );
}
