import { geminiClient } from './gemini.client.js';
import { nvidiaClient } from './nvidia.client.js';
import { logger } from '@shared/logger/logger.js';
import { AiProviderError } from '@shared/errors/app-error.js';
import type { StructuredGenerationOptions } from './gemini.client.js';

/**
 * The single entry point every AI sub-agent (AI Agent LLD §5) calls to
 * get a structured LLM response. Encapsulates the primary/secondary
 * failover policy in exactly one place, so no sub-agent needs to know
 * which provider ultimately answered — it only ever sees a validated
 * `T`, or an `AiProviderError` if BOTH providers failed.
 */
export class LlmOrchestrationClient {
  async generateStructured<T>(options: StructuredGenerationOptions): Promise<{ result: T; modelUsed: string }> {
    try {
      const result = await geminiClient.generateStructured<T>(options);
      return { result, modelUsed: 'gemini' };
    } catch (primaryErr) {
      logger.warn({ err: primaryErr }, 'Primary LLM (Gemini) failed — failing over to NVIDIA NIM');

      try {
        const result = await nvidiaClient.generateStructured<T>(options);
        return { result, modelUsed: 'nvidia-nim' };
      } catch (secondaryErr) {
        logger.error({ primaryErr, secondaryErr }, 'Both primary and secondary LLM providers failed');
        throw new AiProviderError(
          'Both Gemini and NVIDIA NIM failed to generate a response',
          undefined,
          secondaryErr
        );
      }
    }
  }
}

export const llmClient = new LlmOrchestrationClient();
