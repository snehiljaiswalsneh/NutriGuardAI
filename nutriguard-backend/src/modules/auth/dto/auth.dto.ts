import type { LoginResult, RegisterResult } from '../types/auth.types.js';

/**
 * DTOs are the deliberate seam between "what our service layer knows
 * internally" and "what we promise the client over the wire" (matches
 * the API Specification's AuthSuccessEnvelope.data shape exactly) — so
 * changing an internal type never silently changes the public contract.
 */

export interface RegisterResponseDto {
  user_id: string;
  email: string;
}

export function toRegisterResponseDto(result: RegisterResult): RegisterResponseDto {
  return { user_id: result.userId, email: result.email };
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
}

export function toLoginResponseDto(result: LoginResult): LoginResponseDto {
  return {
    access_token: result.tokens.accessToken,
    refresh_token: result.tokens.refreshToken,
    expires_in: result.tokens.expiresIn,
    user: {
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.fullName,
      role: result.user.role,
    },
  };
}
