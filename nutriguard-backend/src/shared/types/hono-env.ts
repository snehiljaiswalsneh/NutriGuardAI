import type { Logger } from '@shared/logger/logger.js';
import type { AppRole } from '@shared/constants/index.js';

/** The authenticated principal attached to context by the auth middleware. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppRole;
}

/**
 * Typed Hono environment (`c.get('requestId')`, `c.get('user')`, etc. are
 * all type-checked against this instead of returning `any`).
 */
export interface AppEnv {
  Variables: {
    requestId: string;
    logger: Logger;
    /** Populated by requireAuth middleware; absent on public routes. */
    user?: AuthenticatedUser;
  };
}
