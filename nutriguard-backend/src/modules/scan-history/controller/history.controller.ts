import type { Context } from 'hono';
import { historyService } from '../service/history.service.js';
import { successResponse } from '@shared/utils/response.js';
import type { HistoryListQuery, ExportQuery } from '../validator/history.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { TokenInvalidError } from '@shared/errors/app-error.js';

function requireUserId(c: Context<AppEnv>): string {
  const user = c.get('user');
  if (!user) throw new TokenInvalidError('Authentication required');
  return user.id;
}

export class HistoryController {
  async list(c: Context<AppEnv>, query: HistoryListQuery) {
    const userId = requireUserId(c);
    const { items, totalItems, nextCursor } = await historyService.list(userId, query);
    return c.json(
      successResponse(items, '', {
        page: query.page,
        limit: query.limit,
        total_items: totalItems,
        total_pages: Math.max(1, Math.ceil(totalItems / query.limit)),
        next_cursor: nextCursor,
      }),
      200
    );
  }

  async export(c: Context<AppEnv>, query: ExportQuery) {
    const userId = requireUserId(c);
    const { contentType, filename, body } = await historyService.export(userId, query.format);
    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(body, 200);
  }
}

export const historyController = new HistoryController();
