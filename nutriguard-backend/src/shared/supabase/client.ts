import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@shared/config/env.js';

/**
 * Anon-key client — used for operations that should run AS the calling
 * user (sign up, sign in, password reset) so Supabase Auth's own rate
 * limiting/security rules apply exactly as they would for a direct
 * client call. Never used for privileged operations.
 */
export const supabaseAnon: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Service-role client — bypasses Row Level Security entirely. Reserved
 * for a small, deliberate set of server-only operations (admin user
 * management, the seed script). NEVER expose this client or its
 * responses directly to any HTTP request without an explicit
 * authorization check first — see requireRole in auth.middleware.ts.
 */
export const supabaseAdmin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
