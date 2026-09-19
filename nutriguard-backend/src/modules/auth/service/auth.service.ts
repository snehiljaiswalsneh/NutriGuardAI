import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnon, supabaseAdmin } from '@shared/supabase/client.js';
import { AuthenticationError, ConflictError, ValidationError } from '@shared/errors/app-error.js';
import { logger } from '@shared/logger/logger.js';
import { UserProfileRepository, userProfileRepository } from '../repository/user-profile.repository.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../validator/auth.validator.js';
import type { AuthTokenPair, AuthenticatedUserView, LoginResult, RegisterResult } from '../types/auth.types.js';
import type { AppRole } from '@shared/constants/index.js';

/**
 * Business logic for authentication. Thin on purpose where Supabase Auth
 * already does the hard/sensitive part (password hashing, token signing,
 * OTP delivery) — this service's job is orchestration: call Supabase
 * Auth, then keep our own `user_profiles` row in sync, and shape errors
 * consistently with the rest of the API.
 *
 * Dependencies are constructor-injected (Supabase client + repository)
 * so unit tests can substitute mocks without hitting a real network call
 * or database — see tests/auth.service.test.ts.
 */
export class AuthService {
  constructor(
    private readonly supabase: SupabaseClient = supabaseAnon,
    private readonly profiles: UserProfileRepository = userProfileRepository
  ) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.full_name } },
    });

    if (error) {
      if (error.status === 422 || /already registered/i.test(error.message)) {
        throw new ConflictError('An account with this email already exists', 'email');
      }
      throw new ValidationError(error.message);
    }

    if (!data.user) {
      // Should not happen if `error` is null, but keeps the return type honest.
      throw new ValidationError('Registration did not return a user record');
    }

    // The profile row is created here (not by a DB trigger reading
    // auth.users) so we control exactly what happens on sign-up failure
    // paths and can extend this step (e.g. send a welcome email) without
    // touching the database layer.
    await this.profiles.create({
      id: data.user.id,
      fullName: input.full_name,
    });

    logger.info({ userId: data.user.id }, 'user registered');

    return { userId: data.user.id, email: data.user.email ?? input.email };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session || !data.user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const profileRow = await this.profiles.findById(data.user.id);

    const user: AuthenticatedUserView = {
      id: data.user.id,
      email: data.user.email ?? input.email,
      fullName: profileRow?.fullName ?? null,
      role: (profileRow?.role as AppRole) ?? 'user',
    };

    return {
      tokens: this.toTokenPair(data.session),
      user,
    };
  }

  async logout(accessToken: string): Promise<void> {
    // Revoking a specific token is a privileged Supabase Admin API call —
    // requires the service-role client, never the anon client used
    // elsewhere in this service.
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken).catch((err: unknown) => ({ error: err }));
    if (error) {
      logger.warn({ error }, 'logout: token revocation reported an error (treated as best-effort)');
    }
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthTokenPair> {
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: input.refresh_token });

    if (error || !data.session) {
      throw new AuthenticationError('Refresh token is invalid or expired');
    }

    return this.toTokenPair(data.session);
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    // Deliberately ignore the result — always respond as if it succeeded
    // (API Specification §3) to prevent account-enumeration via timing
    // or response-shape differences.
    await this.supabase.auth.resetPasswordForEmail(input.email);
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    // In Supabase's flow, `reset_token` arrives as a recovery session
    // established client-side from the emailed link; the Edge Function
    // verifies the OTP token type directly via verifyOtp for a
    // server-driven reset flow (used by non-web clients).
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: input.reset_token,
      type: 'recovery',
    });
    if (error) {
      throw new ValidationError('Reset token is invalid or expired');
    }

    const { error: updateError } = await this.supabase.auth.updateUser({ password: input.new_password });
    if (updateError) {
      throw new ValidationError(updateError.message);
    }
  }

  async verifyEmail(input: VerifyEmailInput): Promise<LoginResult> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email: input.email,
      token: input.otp,
      type: 'signup',
    });

    if (error || !data.session || !data.user) {
      throw new ValidationError('OTP is invalid or expired');
    }

    const profileRow = await this.profiles.findById(data.user.id);

    return {
      tokens: this.toTokenPair(data.session),
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        fullName: profileRow?.fullName ?? null,
        role: (profileRow?.role as AppRole) ?? 'user',
      },
    };
  }

  private toTokenPair(session: { access_token: string; refresh_token: string; expires_in: number }): AuthTokenPair {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    };
  }
}

export const authService = new AuthService();
