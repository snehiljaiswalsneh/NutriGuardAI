import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';
import { closeDatabaseConnection } from '@database/client.js';

const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port, env: env.NODE_ENV }, `NutriGuard AI backend listening on port ${info.port}`);
});

/**
 * Graceful shutdown — stop accepting new connections, let in-flight
 * requests finish, then close the database pool. Matters on Vercel/
 * container platforms that send SIGTERM before killing the process.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'shutdown signal received, closing gracefully...');
  server.close(async () => {
    await closeDatabaseConnection();
    logger.info('shutdown complete');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs beyond 10s.
  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandled promise rejection');
});
