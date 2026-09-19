import type { AppRole } from '@shared/constants/index.js';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthenticatedUserView {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
}

export interface LoginResult {
  tokens: AuthTokenPair;
  user: AuthenticatedUserView;
}

export interface RegisterResult {
  userId: string;
  email: string;
}
