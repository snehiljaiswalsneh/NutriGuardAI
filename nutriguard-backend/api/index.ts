/**
 * Vercel serverless entry point.
 *
 * Vercel's Node.js Serverless Function runtime calls the default export
 * with Node's (req, res) signature: `(http.IncomingMessage, http.ServerResponse)`.
 *
 * We use Hono's official Vercel Node adapter: `handle` from `@hono/node-server/vercel`.
 * It transforms incoming Node HTTP requests and raw headers into a standard Web API
 * `Request` (ensuring `c.req.header()` and `this.raw.headers.get` succeed), passes it
 * to Hono's `app.fetch`, and writes the resulting Web API `Response` back to Node's
 * `ServerResponse` with `res.end()`.
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
import { handle } from '@hono/node-server/vercel';
import { createApp } from '../dist/src/app.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const app = createApp();

export default handle(app);
