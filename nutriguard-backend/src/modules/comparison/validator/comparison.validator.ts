import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '@shared/constants/index.js';

export const createComparisonSchema = z.object({
  scan_a_id: z.string().uuid(),
  scan_b_id: z.string().uuid(),
});
export type CreateComparisonRequest = z.infer<typeof createComparisonSchema>;

export const comparisonIdParamSchema = z.object({
  comparisonId: z.string().uuid(),
});

export const comparisonListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
});
export type ComparisonListQuery = z.infer<typeof comparisonListQuerySchema>;
