import type { Context } from 'hono';
import { authService } from '../service/auth.service.js';
import { toRegisterResponseDto, toLoginResponseDto } from '../dto/auth.dto.js';
import { successResponse } from '@shared/utils/response.js';
import { TokenInvalidError } from '@shared/errors/app-error.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../validator/auth.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/**
 * Controllers only: shape the response envelope and set the status code,
 * delegating all business logic to the service layer. Validated request
 * bodies are passed in explicitly by the route layer (via zValidator +
 * `c.req.valid('json')` at the call site) rather than re-derived here,
 * keeping this class fully decoupled from Hono's validator typings and
 * trivially unit-testable with a plain object.
 */
export class AuthController {
  async register(c: Context<AppEnv>, input: RegisterInput) {
    const result = await authService.register(input);
    return c.json(successResponse(toRegisterResponseDto(result), 'Account created. Please verify your email.'), 201);
  }

  async login(c: Context<AppEnv>, input: LoginInput) {
    const result = await authService.login(input);
    return c.json(successResponse(toLoginResponseDto(result)), 200);
  }

  async logout(c: Context<AppEnv>) {
    const header = c.req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) {
      throw new TokenInvalidError('Missing Authorization header');
    }
    await authService.logout(token);
    return c.body(null, 204);
  }

  async refreshToken(c: Context<AppEnv>, input: RefreshTokenInput) {
    const tokens = await authService.refreshToken(input);
    return c.json(
      successResponse({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn,
      }),
      200
    );
  }

  async forgotPassword(c: Context<AppEnv>, input: ForgotPasswordInput) {
    await authService.forgotPassword(input);
    // Always 200, regardless of whether the email exists — see service layer comment.
    return c.json(successResponse({}, 'If an account exists for that email, a reset link has been sent.'), 200);
  }

  async resetPassword(c: Context<AppEnv>, input: ResetPasswordInput) {
    await authService.resetPassword(input);
    return c.json(successResponse({}, 'Password updated successfully.'), 200);
  }

  async verifyEmail(c: Context<AppEnv>, input: VerifyEmailInput) {
    const result = await authService.verifyEmail(input);
    return c.json(successResponse(toLoginResponseDto(result), 'Email verified.'), 200);
  }

  async session(c: Context<AppEnv>) {
    const user = c.get('user');
    if (!user) {
      throw new TokenInvalidError('No active session');
    }
    return c.json(successResponse({ user_id: user.id, email: user.email, role: user.role }, 'Session is valid'), 200);
  }
}

export const authController = new AuthController();
