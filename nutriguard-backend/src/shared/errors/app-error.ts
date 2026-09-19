/**
 * Base class for every intentional, expected application error.
 * Distinguishes "errors we anticipated and can respond to meaningfully"
 * from unexpected bugs (which fall through to a generic 500 in the
 * global error handler — see middleware/error-handler.ts).
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly isOperational = true;
  readonly field?: string;
  override readonly cause?: unknown;

  constructor(
    message: string,
    field?: string,
    cause?: unknown
  ) {
    super(message);
    this.field = field;
    this.cause = cause;
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /** Shape matching the API Specification's `errors[]` entry. */
  toErrorDetail() {
    return { code: this.code, field: this.field ?? null, message: this.message };
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'VALIDATION_ERROR';
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTH_INVALID_CREDENTIALS';
}

export class TokenExpiredError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTH_TOKEN_EXPIRED';
}

export class TokenInvalidError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTH_TOKEN_INVALID';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN_ROLE';
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' was not found` : `${resource} was not found`);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'DUPLICATE_RESOURCE';
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor(
    message: string,
    public readonly retryAfterSeconds: number
  ) {
    super(message);
  }
}

export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';
}

export class AiProviderError extends AppError {
  readonly statusCode = 502;
  readonly code = 'AI_PROVIDER_ERROR';
}

export class AiTimeoutError extends AppError {
  readonly statusCode = 503;
  readonly code = 'AI_TIMEOUT';
}
