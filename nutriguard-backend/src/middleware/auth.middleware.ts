import { createMiddleware } from 'hono/factory';
import { jwtVerify, type JWTPayload } from 'jose';
import { TokenExpiredError, TokenInvalidError, ForbiddenError } from '@shared/errors/app-error.js';
import { env } from '@shared/config/env.js';
import type { AppEnv, AuthenticatedUser } from '@shared/types/hono-env.js';
import type { AppRole } from '@shared/constants/index.js';

interface SupabaseJwtPayload extends JWTPayload {
  email?: string;
  /** Custom claim populated by a Supabase Auth Hook — see docs/setup.md */
  app_role?: AppRole;
  role?: string; // Supabase's own 'authenticated' | 'anon' role — NOT the app_role
}

const secretKey = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

async function verifySupabaseToken(token: string): Promise<AuthenticatedUser> {
  let payload: SupabaseJwtPayload;

  try {
    const result = await jwtVerify<SupabaseJwtPayload>(token, secretKey, { algorithms: ['HS256'] });
    payload = result.payload;
  } catch (err) {
    if (err instanceof Error && err.name === 'JWTExpired') {
      throw new TokenExpiredError('Access token has expired');
    }
    throw new TokenInvalidError('Access token is invalid', undefined, err);
  }

  if (!payload.sub || !payload.email) {
    throw new TokenInvalidError('Access token is missing required claims');
  }

  return {
    id: payload.sub,
    email: payload.email,
    // Defaults to 'user' when the custom claim hook hasn't populated app_role
    // yet (e.g. brand-new accounts before the first profile-sync run).
    role: payload.app_role ?? 'user',
  };
}

/**
 * Requires a valid Bearer token; populates `c.get('user')`. Use on every
 * route that is not explicitly public (see the API Specification's
 * per-endpoint `security: []` annotations for which routes skip this).
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new TokenInvalidError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  const user = await verifySupabaseToken(token);
  c.set('user', user);
  await next();
});

/**
 * Populates `c.get('user')` if a valid token is present, but does not
 * reject the request if it's absent or invalid — used on public/guest
 * endpoints that behave slightly differently for logged-in users (none
 * currently in v1, reserved for future personalized-guest-search cases).
 */
export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const user = await verifySupabaseToken(header.slice('Bearer '.length));
      c.set('user', user);
    } catch {
      // Swallow — an invalid token on an optional-auth route just means
      // "treat as guest," not "reject the request."
    }
  }
  await next();
});

/**
 * Role-based access control gate. Must run after `requireAuth`. Enforces
 * the API Specification §16 role table at the Edge Function layer — this
 * is the fast-fail check; Postgres RLS (Database Design Document §11) is
 * the actual, non-bypassable authorization boundary underneath it.
 */
export function requireRole(...allowedRoles: AppRole[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new TokenInvalidError('Authentication required before role check');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(', ')}`);
    }
    await next();
  });
}
