import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Base Fetch Wrapper
 *
 * Automatically injects the active Supabase User JWT into the Authorization
 * header on every outbound request, handles token refresh, processes JSON payloads,
 * and standardises HTTP error responses.
 */
async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 25_000, headers: customHeaders, ...restOptions } = options;

  // 1. Resolve active Supabase session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    // 2. Handle HTTP Status Errors
    if (!response.ok) {
      let errBody: any = {};
      try {
        errBody = await response.json();
      } catch {
        // Fallback if response is not JSON
      }

      const errorDetail = errBody.errors?.[0] || {};
      throw new ApiError(
        response.status,
        errorDetail.code || 'UNKNOWN_ERROR',
        errorDetail.message || `Request failed with status ${response.status}`,
        errorDetail.field || null
      );
    }

    // 3. Parse JSON response payload (or return void if 204)
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const payload = await response.json();
    return payload.data as T;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'TIMEOUT_ERROR', 'Request timed out. Please try again.');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    // Network connectivity / browser level fetch failure
    throw new ApiError(0, 'NETWORK_ERROR', error.message || 'Network connection failed.');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
