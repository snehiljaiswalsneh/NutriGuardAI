import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '@shared/constants/index.js';

export const historyListQuerySchema = z.object({
  risk_level: z.enum(['safe', 'moderate', 'high', 'unknown']).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  q: z.string().trim().max(300).optional(),
  cursor: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
  sort: z.string().max(50).optional(),
});
export type HistoryListQuery = z.infer<typeof historyListQuerySchema>;

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
});
export type ExportQuery = z.infer<typeof exportQuerySchema>;
