import OpenAI from 'openai';
import { env } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';
import { AiProviderError, AiTimeoutError } from '@shared/errors/app-error.js';
import type { StructuredGenerationOptions } from './gemini.client.js';
import { aiMetrics } from '../monitoring/ai-metrics.js';

// Initialize the OpenAI client pointing to the NVIDIA NIM endpoint
const client = new OpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 25_000,
});

/**
 * NvidiaClient — Secondary LLM Client (Migrated).
 *
 * Serves as the AI Orchestrator's automatic fallback when the primary Gemini
 * model fails. Since NVIDIA NIM provides an OpenAI-compatible API, we leverage
 * the OpenAI SDK and configure it with NVIDIA's Base URL.
 */
export class NvidiaClient {
  async generateStructured<T>(options: StructuredGenerationOptions, retries = 1): Promise<T> {
    const systemPrompt = options.systemPrompt;
    // NVIDIA NIM uses standard chat completions. Schema conformance is enforced
    // by appending JSON schema instructions and relying on the validation gate.
    const userPrompt = `${options.userPrompt}\n\nRespond with ONLY a single valid JSON object matching this JSON Schema, with no extra prose, markdown, or code fences:\n${JSON.stringify(options.jsonSchema)}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const startMs = Date.now();
      try {
        const response = await client.chat.completions.create({
          model: env.AI_SECONDARY_MODEL,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxOutputTokens ?? 1500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new AiProviderError('NVIDIA NIM returned an empty response');

        const parsed = JSON.parse(this.stripMarkdownFences(content)) as T;

        // Record metrics
        if (response.usage) {
          aiMetrics.record({
            agent: options.schemaName,
            model: env.AI_SECONDARY_MODEL,
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            latencyMs: Date.now() - startMs,
            cacheHit: false,
            fallback: true,
          });
        }

        return parsed;
      } catch (err) {
        const isLastAttempt = attempt === retries;
        const isTimeout = err instanceof Error && /timeout/i.test(err.message);

        logger.warn({ attempt, err }, 'NVIDIA NIM structured generation failed');

        if (isLastAttempt) {
          if (isTimeout) throw new AiTimeoutError('NVIDIA NIM request timed out', undefined, err);
          throw new AiProviderError('NVIDIA NIM request failed after retries', undefined, err);
        }
      }
    }
    throw new AiProviderError('Unreachable: structured generation exhausted retries');
  }

  private stripMarkdownFences(text: string): string {
    return text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
}

export const nvidiaClient = new NvidiaClient();
export const anthropicClient = nvidiaClient; // Keep compatibility export for files importing anthropicClient
