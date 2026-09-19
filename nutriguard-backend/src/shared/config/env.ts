import 'dotenv/config';
import { cleanEnv, str, port, num, bool, url } from 'envalid';

/**
 * Validates and types every environment variable the application depends on.
 * Fails fast at boot (throws + exits) if anything required is missing or
 * malformed, rather than surfacing a confusing runtime error later deep
 * inside a request handler.
 */
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  API_BASE_PATH: str({ default: '/api/v1' }),
  LOG_LEVEL: str({ choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'], default: 'info' }),

  SUPABASE_URL: url(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
  SUPABASE_JWT_SECRET: str(),

  DATABASE_URL: str(),
  DATABASE_POOL_MAX: num({ default: 10 }),

  GEMINI_API_KEY: str(),
  GEMINI_EMBEDDING_MODEL: str({ default: 'gemini-embedding-001' }),
  NVIDIA_API_KEY: str(),
  AI_PRIMARY_MODEL: str({ default: 'gemini-3.5-flash' }),
  AI_SECONDARY_MODEL: str({ default: 'meta/llama-3.1-70b-instruct' }),

  CORS_ALLOWED_ORIGINS: str({ default: 'http://localhost:5173' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 300_000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 300 }),

  FEATURE_OCR_ENABLED: bool({ default: false }),
  FEATURE_BARCODE_ENABLED: bool({ default: false }),
  FEATURE_VOICE_ENABLED: bool({ default: false }),
});

/** Parsed, ready-to-use CORS allow-list (comma-separated env var -> string[]). */
export const corsAllowedOrigins: string[] = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());

export type Env = typeof env;
