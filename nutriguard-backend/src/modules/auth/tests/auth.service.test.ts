import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../service/auth.service.js';
import { UserProfileRepository } from '../repository/user-profile.repository.js';
import { AuthenticationError, ConflictError } from '@shared/errors/app-error.js';

/**
 * Unit tests for AuthService in isolation — both dependencies
 * (Supabase client, repository) are mocked, so these run instantly with
 * no network/database access, per the "unit-test friendly design"
 * requirement. Integration tests (tests/integration/) cover the real
 * wiring end-to-end against a test Supabase project.
 */

function createMockSupabase(overrides: Partial<SupabaseClient['auth']> = {}): SupabaseClient {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      refreshSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
      updateUser: vi.fn(),
      admin: { signOut: vi.fn() },
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

function createMockRepository(): UserProfileRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdWithSettings: vi.fn(),
    updateProfile: vi.fn(),
  } as unknown as UserProfileRepository;
}

describe('AuthService', () => {
  let repository: UserProfileRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('register', () => {
    it('creates a Supabase Auth user and a matching profile row', async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'alex@example.com' }, session: null },
          error: null,
        }),
      });
      const service = new AuthService(supabase, repository);

      const result = await service.register({
        full_name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'Str0ngP@ss1',
      });

      expect(result).toEqual({ userId: 'user-123', email: 'alex@example.com' });
      expect(repository.create).toHaveBeenCalledWith({ id: 'user-123', fullName: 'Alex Morgan' });
    });

    it('throws ConflictError when the email is already registered', async () => {
      const supabase = createMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'User already registered', status: 422 },
        }),
      });
      const service = new AuthService(supabase, repository);

      await expect(
        service.register({ full_name: 'Alex Morgan', email: 'alex@example.com', password: 'Str0ngP@ss1' })
      ).rejects.toBeInstanceOf(ConflictError);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens and a merged user view on valid credentials', async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-123', email: 'alex@example.com' },
            session: { access_token: 'access-abc', refresh_token: 'refresh-abc', expires_in: 3600 },
          },
          error: null,
        }),
      });
      repository.findById = vi.fn().mockResolvedValue({ fullName: 'Alex Morgan', role: 'user' });
      const service = new AuthService(supabase, repository);

      const result = await service.login({ email: 'alex@example.com', password: 'Str0ngP@ss1' });

      expect(result.tokens).toEqual({ accessToken: 'access-abc', refreshToken: 'refresh-abc', expiresIn: 3600 });
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'alex@example.com',
        fullName: 'Alex Morgan',
        role: 'user',
      });
    });

    it('throws AuthenticationError on invalid credentials', async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        }),
      });
      const service = new AuthService(supabase, repository);

      await expect(service.login({ email: 'alex@example.com', password: 'wrong' })).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it('defaults role to "user" when no profile row exists yet', async () => {
      const supabase = createMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-999', email: 'new@example.com' },
            session: { access_token: 'a', refresh_token: 'r', expires_in: 3600 },
          },
          error: null,
        }),
      });
      repository.findById = vi.fn().mockResolvedValue(null);
      const service = new AuthService(supabase, repository);

      const result = await service.login({ email: 'new@example.com', password: 'Str0ngP@ss1' });

      expect(result.user.role).toBe('user');
      expect(result.user.fullName).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('returns a new token pair on a valid refresh token', async () => {
      const supabase = createMockSupabase({
        refreshSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 } },
          error: null,
        }),
      });
      const service = new AuthService(supabase, repository);

      const tokens = await service.refreshToken({ refresh_token: 'old-refresh' });

      expect(tokens).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 3600 });
    });

    it('throws AuthenticationError when the refresh token is invalid', async () => {
      const supabase = createMockSupabase({
        refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: { message: 'invalid token' } }),
      });
      const service = new AuthService(supabase, repository);

      await expect(service.refreshToken({ refresh_token: 'bad-token' })).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('forgotPassword', () => {
    it('never throws, even if the underlying call errors (prevents account enumeration)', async () => {
      const supabase = createMockSupabase({
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { message: 'user not found' } }),
      });
      const service = new AuthService(supabase, repository);

      await expect(service.forgotPassword({ email: 'nobody@example.com' })).resolves.toBeUndefined();
    });
  });
});
