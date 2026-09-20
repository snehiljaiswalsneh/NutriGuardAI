/**
 * Vercel serverless entry point.
 *
 * Vercel's Node.js runtime calls the default-exported function with each
 * incoming request (as a Web API `Request`) and expects a `Response` back.
 * Hono's `app.fetch` satisfies that contract exactly.
 *
 * The app is instantiated once at module level so it is reused across
 * warm invocations — middleware chains, route registrations, and compiled
 * Zod schemas are all built only once per cold start.
 *
 * Imports the pre-built, alias-resolved application from `dist/` so that
 * TypeScript path aliases (@shared/*, @modules/*, etc.) resolved by
 * `tsc-alias` during `npm run build` are used in production on Vercel.
 *
 * Local development still uses `src/server.ts` → `npm run dev` is unchanged.
 */
import { createApp } from '../dist/src/app.js';

const app = createApp();

export default app.fetch;
