import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { db } from './client.js';
import { userProfiles, userSettings } from './schema/index.js';
import { logger } from '@shared/logger/logger.js';

config();

/**
 * Development-only seed script. Creates one local test user through the
 * Supabase Auth admin API (since `auth.users` cannot be inserted into
 * directly — it's fully Supabase-managed) and then seeds the
 * corresponding `user_profiles`/`user_settings` rows via Drizzle.
 *
 * Usage: `npm run db:seed` (requires SUPABASE_SERVICE_ROLE_KEY — never
 * run this against a production project).
 */
async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the seed script against a production environment');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to seed');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testEmail = 'dev.user@nutriguard.test';

  logger.info({ email: testEmail }, 'creating dev auth user (or reusing if it already exists)');

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'DevPassword123!',
    email_confirm: true,
  });

  let userId: string;

  if (createError) {
    // Most likely "already registered" on a re-run — look the user up instead.
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = list.users.find((u) => u.email === testEmail);
    if (!existing) throw createError;
    userId = existing.id;
    logger.info({ userId }, 'dev user already existed, reusing');
  } else {
    userId = created.user.id;
    logger.info({ userId }, 'dev user created');
  }

  await db
    .insert(userProfiles)
    .values({ id: userId, fullName: 'Dev User', role: 'admin', countryCode: 'US' })
    .onConflictDoUpdate({ target: userProfiles.id, set: { fullName: 'Dev User', role: 'admin' } });

  await db
    .insert(userSettings)
    .values({ userId, theme: 'system' })
    .onConflictDoNothing({ target: userSettings.userId });

  logger.info({ userId, email: testEmail }, 'seed complete — log in with these credentials locally');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'seed failed');
    process.exit(1);
  });
