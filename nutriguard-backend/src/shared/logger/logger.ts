import pino from 'pino';
import { env } from '@shared/config/env.js';

/**
 * Root application logger. In development, pretty-prints to the console;
 * in production, emits structured JSON (one line per log entry) suitable
 * for ingestion by any log aggregator (Supabase Logs, Vercel Logs, etc.).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
  base: { env: env.NODE_ENV },
});

/**
 * Creates a request-scoped child logger carrying a `requestId` on every
 * subsequent log line, so every log emitted while handling one HTTP
 * request can be correlated end-to-end (see middleware/request-id.ts).
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({ requestId, ...(userId ? { userId } : {}) });
}

export type Logger = typeof logger;
