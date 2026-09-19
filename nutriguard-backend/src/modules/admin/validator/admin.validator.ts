import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '@shared/constants/index.js';

export const dashboardMetricsQuerySchema = z.object({
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
});
export type DashboardMetricsQuery = z.infer<typeof dashboardMetricsQuerySchema>;

export const userListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;
