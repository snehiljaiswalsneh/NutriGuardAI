/**
 * Mirrors the `app_role` PostgreSQL enum (Database Design Document §8).
 * Kept as a TypeScript union backed by string constants — never compared
 * via magic strings elsewhere in the codebase.
 */
export const AppRole = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

/** Roles considered "admin-tier" for the `requireRole('admin')` middleware shorthand. */
export const ADMIN_ROLES: readonly AppRole[] = [AppRole.ADMIN, AppRole.SUPER_ADMIN];

export const RiskLevel = {
  SAFE: 'safe',
  MODERATE: 'moderate',
  HIGH: 'high',
  UNKNOWN: 'unknown',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

/** Default/maximum pagination limits, referenced by every list endpoint's validator. */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

/** Header names used consistently across middleware. */
export const HEADER = {
  REQUEST_ID: 'X-Request-Id',
  RETRY_AFTER: 'Retry-After',
} as const;
