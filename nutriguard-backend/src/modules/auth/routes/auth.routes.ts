import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authController } from '../controller/auth.controller.js';
import { requireAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validator/auth.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Route definitions only — no business logic. Mounted at `/auth` by the
 * root app (see app.ts), which combines with the global `/api/v1` prefix
 * to match the API Specification's documented paths exactly.
 */
export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/register', rateLimitTiers.auth, zValidator('json', registerSchema), (c) =>
  authController.register(c, c.req.valid('json'))
);

authRoutes.post('/login', rateLimitTiers.auth, zValidator('json', loginSchema), (c) =>
  authController.login(c, c.req.valid('json'))
);

authRoutes.post('/logout', requireAuth, (c) => authController.logout(c));

authRoutes.post('/refresh-token', zValidator('json', refreshTokenSchema), (c) =>
  authController.refreshToken(c, c.req.valid('json'))
);

authRoutes.post('/forgot-password', rateLimitTiers.auth, zValidator('json', forgotPasswordSchema), (c) =>
  authController.forgotPassword(c, c.req.valid('json'))
);

authRoutes.post('/reset-password', zValidator('json', resetPasswordSchema), (c) =>
  authController.resetPassword(c, c.req.valid('json'))
);

authRoutes.post('/verify-email', zValidator('json', verifyEmailSchema), (c) =>
  authController.verifyEmail(c, c.req.valid('json'))
);

authRoutes.get('/session', requireAuth, (c) => authController.session(c));
