import type { Context } from 'hono';
import { comparisonService } from '../service/comparison.service.js';
import { successResponse, buildPaginationMeta } from '@shared/utils/response.js';
import type { CreateComparisonRequest, ComparisonListQuery } from '../validator/comparison.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { TokenInvalidError } from '@shared/errors/app-error.js';

function requireUserId(c: Context<AppEnv>): string {
  const user = c.get('user');
  if (!user) throw new TokenInvalidError('Authentication required');
  return user.id;
}

export class ComparisonController {
  async create(c: Context<AppEnv>, input: CreateComparisonRequest) {
    const userId = requireUserId(c);
    const result = await comparisonService.compare(userId, input.scan_a_id, input.scan_b_id);
    return c.json(
      successResponse(
        {
          comparison_id: result.comparisonId,
          winner: result.winner,
          recommendation_text: result.recommendationText,
          differences: result.differences,
        },
        'Comparison created'
      ),
      201
    );
  }

  async list(c: Context<AppEnv>, query: ComparisonListQuery) {
    const userId = requireUserId(c);
    const rows = await comparisonService.list(userId, query.page, query.limit);
    return c.json(successResponse(rows, '', buildPaginationMeta(query.page, query.limit, rows.length)), 200);
  }

  async getById(c: Context<AppEnv>, comparisonId: string) {
    const userId = requireUserId(c);
    const row = await comparisonService.getById(comparisonId, userId);
    return c.json(successResponse(row), 200);
  }

  async delete(c: Context<AppEnv>, comparisonId: string) {
    const userId = requireUserId(c);
    await comparisonService.delete(comparisonId, userId);
    return c.body(null, 204);
  }
}

export const comparisonController = new ComparisonController();
