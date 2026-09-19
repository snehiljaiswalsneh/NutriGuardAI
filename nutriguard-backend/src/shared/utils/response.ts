/** Matches the API Specification Document §13 envelope exactly. */
export interface ApiSuccessEnvelope<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errors: never[];
}

export interface ErrorDetail {
  code: string;
  field: string | null;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  data: Record<string, never>;
  meta: Record<string, unknown>;
  errors: ErrorDetail[];
}

export function successResponse<T>(data: T, message = '', meta: Record<string, unknown> = {}): ApiSuccessEnvelope<T> {
  return { success: true, message, data, meta, errors: [] };
}

export function errorResponse(message: string, errors: ErrorDetail[], meta: Record<string, unknown> = {}): ApiErrorEnvelope {
  return { success: false, message, data: {}, meta, errors };
}

export interface PaginationMeta {
  [key: string]: unknown;
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  next_cursor: string | null;
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number, nextCursor: string | null = null): PaginationMeta {
  return {
    page,
    limit,
    total_items: totalItems,
    total_pages: Math.max(1, Math.ceil(totalItems / limit)),
    next_cursor: nextCursor,
  };
}
