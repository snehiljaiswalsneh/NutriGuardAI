import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';
import * as schema from './schema/index.js';

/**
 * Single shared postgres-js connection pool for the whole process.
 * Reused across every repository — never instantiate a second client.
 *
 * PRODUCTION NOTE: point DATABASE_URL at Supabase's "Transaction pooler"
 * (Supavisor, port 6543) for the running application, since Edge/serverless
 * functions open many short-lived connections; use the "Session pooler"
 * (port 5432) only for the one-off `db:migrate` script, which needs
 * session-level features (advisory locks) that transaction mode doesn't
 * support.
 */
const client = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  onnotice: (notice) => logger.debug({ notice }, 'postgres notice'),
});

export const db = drizzle(client, { schema, logger: env.NODE_ENV === 'development' });

/** Call once during graceful shutdown (see server.ts). */
export async function closeDatabaseConnection(): Promise<void> {
  await client.end({ timeout: 5 });
  logger.info('database connection closed');
}

export type Database = typeof db;
