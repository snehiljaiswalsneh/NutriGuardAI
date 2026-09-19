import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';
import { logger } from '@shared/logger/logger.js';

config();

/**
 * Runs every pending migration in `src/database/migrations` against
 * DATABASE_URL, in filename order. Uses a dedicated single connection
 * (max: 1) — migrations must run sequentially, never pooled/parallel.
 *
 * Usage: `npm run db:migrate`
 */
async function run(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  logger.info('running migrations...');
  await migrate(db, { migrationsFolder: './src/database/migrations' });
  logger.info('migrations complete');

  await migrationClient.end();
}

run().catch((err) => {
  logger.error({ err }, 'migration failed');
  process.exit(1);
});
