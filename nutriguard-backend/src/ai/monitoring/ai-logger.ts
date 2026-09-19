import { logger } from '@shared/logger/logger.js';

/**
 * AI Logger — AI Integration Layer Phase 10.
 *
 * Provides named, structured log events for every significant AI lifecycle
 * event. Using named event types (the `ai.event` field) instead of free-form
 * messages makes it possible to build precise log-aggregator filters,
 * dashboards, and alerts without parsing message strings.
 *
 * All events use `logger.info` by default; errors are `logger.error`.
 * The `ai.event` field can be used as the primary filter key in any
 * structured log system (Supabase Logs, Datadog, etc.).
 *
 * Usage:
 * ```ts
 * import { aiLogger } from '@ai/monitoring/ai-logger.js';
 * aiLogger.request({ agent: 'summary_agent', model: 'gpt-5', promptLength: 1200 });
 * aiLogger.cacheHit({ agent: 'summary_agent', keyPrefix: 'a3f91b' });
 * ```
 */
export const aiLogger = {
  /** Emitted immediately before an LLM API call is dispatched. */
  request(data: { agent: string; model: string; promptLength: number; streaming?: boolean }): void {
    logger.info({ 'ai.event': 'ai.request', ...data }, 'AI request dispatched');
  },

  /** Emitted when an LLM responds successfully. */
  response(data: { agent: string; model: string; latencyMs: number; tokenCount: number }): void {
    logger.info({ 'ai.event': 'ai.response', ...data }, 'AI response received');
  },

  /**
   * Emitted when the primary LLM (GPT-5) fails and the orchestrator
   * automatically retries with the secondary (Claude).
   */
  fallback(data: { agent: string; fromModel: string; toModel: string; reason: string }): void {
    logger.warn({ 'ai.event': 'ai.fallback', ...data }, 'AI provider fallback triggered');
  },

  /**
   * Emitted when a prompt or embedding cache serves the result without
   * making an API call. Helps quantify cache effectiveness.
   */
  cacheHit(data: { agent: string; cacheType: 'prompt' | 'embedding'; keyPrefix: string }): void {
    logger.info({ 'ai.event': 'ai.cache_hit', ...data }, 'AI cache hit');
  },

  /**
   * Emitted when the prompt injection guard blocks a request.
   * This is a security-relevant event and should be alerted on.
   */
  injectionBlocked(data: { reason: string; inputLength: number; matchedPattern?: string }): void {
    logger.warn({ 'ai.event': 'ai.injection_blocked', ...data }, 'Prompt injection attempt blocked');
  },

  /**
   * Emitted when the response validator rejects an LLM output (hallucination
   * check or schema failure). Helps identify prompts that need tuning.
   */
  validationFailed(data: { agent: string; model: string; reason: string }): void {
    logger.warn({ 'ai.event': 'ai.validation_failed', ...data }, 'AI response validation failed');
  },

  /**
   * Emitted when both primary and secondary LLMs fail and the system
   * falls back to a deterministic template-based response.
   */
  templateFallback(data: { agent: string; reason: string }): void {
    logger.error({ 'ai.event': 'ai.template_fallback', ...data }, 'AI fell back to deterministic template');
  },

  /**
   * Emitted when an analysis workflow completes end-to-end.
   * Provides a single log line summarising the full pipeline outcome.
   */
  workflowComplete(data: {
    workflowName: string;
    durationMs: number;
    modelUsed: string;
    matchedCount: number;
    unmatchedCount: number;
    safetyScore?: number;
    cacheHit: boolean;
  }): void {
    logger.info({ 'ai.event': 'ai.workflow_complete', ...data }, 'AI workflow completed');
  },
};
