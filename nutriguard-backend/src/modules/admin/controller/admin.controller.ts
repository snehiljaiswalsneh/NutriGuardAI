import type { Context } from 'hono';
import { adminService } from '../service/admin.service.js';
import { successResponse, buildPaginationMeta } from '@shared/utils/response.js';
import type { DashboardMetricsQuery, UserListQuery } from '../validator/admin.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export class AdminController {
  async getDashboardMetrics(c: Context<AppEnv>, query: DashboardMetricsQuery) {
    const metrics = await adminService.getDashboardMetrics(query.from_date);
    return c.json(successResponse(metrics), 200);
  }

  async listUsers(c: Context<AppEnv>, query: UserListQuery) {
    const { items, total } = await adminService.listUsers(query.q, query.page, query.limit);
    return c.json(successResponse(items, '', buildPaginationMeta(query.page, query.limit, total)), 200);
  }
}

export const adminController = new AdminController();
