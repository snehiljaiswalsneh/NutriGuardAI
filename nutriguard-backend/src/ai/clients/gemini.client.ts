import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';
import { AiProviderError, AiTimeoutError } from '@shared/errors/app-error.js';
import { aiMetrics } from '../monitoring/ai-metrics.js';
export interface StructuredGenerationOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface StreamGenerationOptions {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

// Initialise the native Google Gen AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Converts a standard JSON Schema (with lowercase types) into a schema
 * structured for Gemini (which requires uppercase SchemaType enum values).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGeminiSchema(schema: any): any {
  if (!schema) return undefined;

  const typeMap: Record<string, SchemaType> = {
    string: SchemaType.STRING,
    number: SchemaType.NUMBER,
    integer: SchemaType.INTEGER,
    boolean: SchemaType.BOOLEAN,
    array: SchemaType.ARRAY,
    object: SchemaType.OBJECT,
  };

  // If schema.type is an array (e.g. ['string', 'null']), extract the primary type
  const typeStr = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  const geminiType = typeMap[typeStr as string] || SchemaType.STRING;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    type: geminiType,
    description: schema.description,
  };

  if (schema.enum) {
    result.enum = schema.enum;
  }

  if (geminiType === SchemaType.OBJECT && schema.properties) {
    result.properties = {};
    for (const key of Object.keys(schema.properties)) {
      result.properties[key] = toGeminiSchema(schema.properties[key]);
    }
    if (schema.required) {
      result.required = schema.required;
    }
  }

  if (geminiType === SchemaType.ARRAY && schema.items) {
    result.items = toGeminiSchema(schema.items);
  }

  return result;
}

/**
 * GeminiClient — AI Integration Layer (Migrated).
 *
 * Wraps Google's official Gemini API client, implementing structured outputs,
 * embeddings, and streaming. Always maps provider errors to the app's own
 * `AiProviderError`/`AiTimeoutError`.
 */
export class GeminiClient {
  async generateStructured<T>(options: StructuredGenerationOptions, retries = 2): Promise<T> {
    const geminiSchema = toGeminiSchema(options.jsonSchema);

    for (let attempt = 0; attempt <= retries; attempt++) {
      const startMs = Date.now();
      try {
        const model = genAI.getGenerativeModel({
          model: env.AI_PRIMARY_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: geminiSchema,
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxOutputTokens ?? 1500,
          },
          systemInstruction: options.systemPrompt,
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: options.userPrompt }] }],
        });

        const content = result.response.text();
        if (!content) throw new AiProviderError('Gemini returned an empty response');

        const parsed = JSON.parse(content) as T;

        // Record metrics (approximate tokens if not returned by SDK)
        const usage = result.response.usageMetadata;
        const promptTokens = usage?.promptTokenCount ?? 0;
        const completionTokens = usage?.candidatesTokenCount ?? 0;

        aiMetrics.record({
          agent: options.schemaName,
          model: env.AI_PRIMARY_MODEL,
          promptTokens,
          completionTokens,
          latencyMs: Date.now() - startMs,
          cacheHit: false,
          fallback: false,
        });

        return parsed;
      } catch (err) {
        const isLastAttempt = attempt === retries;
        const isTimeout = err instanceof Error && /timeout/i.test(err.message);

        logger.warn({ attempt, err }, 'Gemini structured generation failed');

        if (isLastAttempt) {
          if (isTimeout) throw new AiTimeoutError('Gemini request timed out', undefined, err);
          throw new AiProviderError('Gemini request failed after retries', undefined, err);
        }

        await this.backoff(attempt);
      }
    }
    throw new AiProviderError('Unreachable: structured generation exhausted retries');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_EMBEDDING_MODEL,
      });

      const response = await model.embedContent(text.slice(0, 8000));

      const embedding = response.embedding.values;
      if (!embedding) throw new AiProviderError('Gemini returned no embedding vector');
      return embedding;
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw new AiProviderError('Failed to generate Gemini embedding', undefined, err);
    }
  }

  async *generateStream(options: StreamGenerationOptions): AsyncIterable<string> {
    const startMs = Date.now();
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const model = genAI.getGenerativeModel({
        model: env.AI_PRIMARY_MODEL,
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 1000,
        },
        systemInstruction: options.systemPrompt,
      });

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: options.userPrompt }] }],
      });

      for await (const chunk of result.stream) {
        const token = chunk.text();
        if (token) yield token;
      }

      const response = await result.response;
      const usage = response.usageMetadata;
      promptTokens = usage?.promptTokenCount ?? 0;
      completionTokens = usage?.candidatesTokenCount ?? 0;
    } catch (err) {
      const isTimeout = err instanceof Error && /timeout/i.test(err.message);
      if (isTimeout) throw new AiTimeoutError('Gemini stream timed out', undefined, err);
      throw new AiProviderError('Gemini stream failed', undefined, err);
    } finally {
      aiMetrics.record({
        agent: 'stream',
        model: env.AI_PRIMARY_MODEL,
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - startMs,
        cacheHit: false,
        fallback: false,
      });
    }
  }

  private async backoff(attempt: number): Promise<void> {
    const delayMs = 500 * 2 ** attempt + Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export const geminiClient = new GeminiClient();
export const openAiClient = geminiClient; // Keep compatibility export for files importing openAiClient
