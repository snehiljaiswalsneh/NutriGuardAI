import type { Context } from 'hono';
import { stream } from 'hono/streaming';
import { logger } from '@shared/logger/logger.js';

/**
 * An async-iterable token stream as returned by the OpenAI SDK's
 * streaming completions API.
 */
export type TokenStream = AsyncIterable<string>;

/**
 * Hono SSE Stream Handler — AI Integration Layer Phase 7.
 *
 * Adapts an async-iterable token stream (from `OpenAiClient.generateStream`)
 * into a proper HTTP streaming response that Hono's client can consume
 * as Server-Sent Events (SSE).
 *
 * Wire format (SSE standard, same as OpenAI's own streaming API):
 *
 * ```
 * data: {"token":"This"}\n\n
 * data: {"token":" product"}\n\n
 * data: {"token":" scored"}\n\n
 * data: [DONE]\n\n
 * ```
 *
 * Usage in a Hono route handler:
 * ```ts
 * import { streamToHonoResponse, type TokenStream } from '@ai/streaming/stream-handler.js';
 *
 * app.get('/ai/stream', requireAuth, async (c) => {
 *   const tokenStream = openAiClient.generateStream({ ... });
 *   return streamToHonoResponse(c, tokenStream);
 * });
 * ```
 *
 * The response sets:
 * - `Content-Type: text/event-stream`
 * - `Cache-Control: no-cache`
 * - `Connection: keep-alive`
 * - `X-Accel-Buffering: no`  (disables nginx/Vercel edge buffering)
 */
export function streamToHonoResponse(c: Context, tokenStream: TokenStream): Response {
  return stream(c, async (s) => {
    try {
      for await (const token of tokenStream) {
        // Emit each token as an SSE data event
        await s.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      // Signal stream completion
      await s.write('data: [DONE]\n\n');
    } catch (err) {
      logger.error({ err }, 'SSE stream: error during token emission');
      // Emit an error event so the client can react rather than hanging
      await s.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    }
  });
}

/**
 * Collects all tokens from a `TokenStream` into a single string.
 * Useful in tests or when a caller needs the full text but the only
 * source available is a streaming response.
 */
export async function drainStream(tokenStream: TokenStream): Promise<string> {
  const chunks: string[] = [];
  for await (const token of tokenStream) {
    chunks.push(token);
  }
  return chunks.join('');
}
