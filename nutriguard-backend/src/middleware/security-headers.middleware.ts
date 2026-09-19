import { secureHeaders } from 'hono/secure-headers';

/**
 * Hono's built-in `secureHeaders` middleware is the Helmet equivalent in
 * this stack — sets X-Content-Type-Options, X-Frame-Options,
 * Strict-Transport-Security, Referrer-Policy, etc. Configured here once
 * so every route gets the same baseline regardless of module.
 */
export const securityHeadersMiddleware = secureHeaders({
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
});
