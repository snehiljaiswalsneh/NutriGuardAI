/**
 * Runs before every test file. envalid validates `process.env` the
 * moment `src/shared/config/env.ts` is first imported — since almost
 * every module transitively imports it, tests need these dummy values
 * present even when the real environment (Supabase, AI providers) isn't
 * configured, so unit tests never accidentally depend on real secrets.
 */
process.env.NODE_ENV ??= 'test';
process.env.SUPABASE_URL ??= 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET ??= 'test-jwt-secret-at-least-32-chars-long';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/nutriguard_test';
process.env.GEMINI_API_KEY ??= 'test-gemini-api-key';
process.env.NVIDIA_API_KEY ??= 'test-nvidia-api-key';
