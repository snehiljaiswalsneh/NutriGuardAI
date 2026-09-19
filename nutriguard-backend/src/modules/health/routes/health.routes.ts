import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '@database/client.js';
import { successResponse } from '@shared/utils/response.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export const healthRoutes = new Hono<AppEnv>();

/**
 * Liveness probe — process is up and able to respond. Used by
 * Vercel/uptime monitors; must never touch the database (should stay
 * fast/independent of downstream health).
 */
healthRoutes.get('/', (c) => {
  return c.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});

/**
 * Readiness probe — confirms the database connection is actually usable,
 * not just that the process is running. Used by deployment tooling to
 * gate traffic cutover.
 */
healthRoutes.get('/ready', async (c) => {
  try {
    await db.execute(sql`select 1`);
  } catch (err) {
    c.get('logger').error({ err }, 'readiness check: database unreachable');
    return c.json(successResponse({ status: 'degraded', database: 'unreachable' }, '', {}), 503);
  }
  return c.json(successResponse({ status: 'ok', database: 'reachable' }));
});
