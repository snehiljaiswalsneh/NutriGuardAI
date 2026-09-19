import { logger } from '@shared/logger/logger.js';

/** Published token costs in USD per 1 000 000 tokens (as of model release). */
const COST_PER_M_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-5':             { input: 2.50,  output: 10.00 },
  'gpt-4o':            { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':       { input: 0.15,  output: 0.60  },
  'claude-sonnet-5':   { input: 3.00,  output: 15.00 },
  'claude-3-5-sonnet': { input: 3.00,  output: 15.00 },
  'fallback-template': { input: 0.00,  output: 0.00  },
};

export interface AiCallMetric {
  /** Agent or operation name (e.g., `summary_agent_output`, `stream`, `embedding`). */
  agent: string;
  /** Fully-qualified model name that served the request. */
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Wall-clock milliseconds from first byte sent to last byte received. */
  latencyMs: number;
  /** Was this result served from the prompt or embedding cache? */
  cacheHit: boolean;
  /** Did this call fall back from the primary to the secondary LLM? */
  fallback: boolean;
  /** Optional structured error information if the call partially failed. */
  error?: string;
}

export interface AiMetricsSummary {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  estimatedCostUsd: number;
  cacheHitRate: number;
  fallbackRate: number;
  avgLatencyMs: number;
}

/**
 * AI Metrics — AI Integration Layer Phase 10.
 *
 * Lightweight in-process token/cost/latency tracker. Every AI client
 * call emits one `AiCallMetric` to this service, which:
 *   1. Emits a structured Pino log line (`level: "info"`, field `ai.metric`)
 *      so metrics are captured by any log aggregator without extra infra.
 *   2. Accumulates running totals (in-process only) for health-check
 *      and admin endpoints to expose without a separate metrics store.
 *
 * Cost calculation uses published $/M token rates for each model.
 * The rates are configurable constants at the top of this file and
 * should be updated when OpenAI/Anthropic revise pricing.
 *
 * Production upgrade path: replace `record()` with an emit to a
 * time-series database (e.g., Supabase `ai_metrics` table or
 * OpenTelemetry exporter) without changing any call sites.
 */
export class AiMetricsService {
  private totalCalls = 0;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private totalCostUsd = 0;
  private cacheHits = 0;
  private fallbacks = 0;
  private totalLatencyMs = 0;

  /**
   * Record a single AI call metric. Called by AI clients immediately
   * after receiving a response (or in a `finally` block for streams).
   */
  record(metric: AiCallMetric): void {
    const costUsd = this.estimateCost(metric.model, metric.promptTokens, metric.completionTokens);

    // Accumulate running totals
    this.totalCalls++;
    this.totalPromptTokens += metric.promptTokens;
    this.totalCompletionTokens += metric.completionTokens;
    this.totalCostUsd += costUsd;
    this.totalLatencyMs += metric.latencyMs;
    if (metric.cacheHit) this.cacheHits++;
    if (metric.fallback) this.fallbacks++;

    // Emit structured log line — captured by Pino and any log aggregator
    logger.info(
      {
        'ai.metric': true,
        agent: metric.agent,
        model: metric.model,
        promptTokens: metric.promptTokens,
        completionTokens: metric.completionTokens,
        totalTokens: metric.promptTokens + metric.completionTokens,
        latencyMs: metric.latencyMs,
        costUsd: Number(costUsd.toFixed(6)),
        cacheHit: metric.cacheHit,
        fallback: metric.fallback,
        ...(metric.error ? { error: metric.error } : {}),
      },
      'ai call recorded'
    );
  }

  /**
   * Returns a snapshot of running in-process totals.
   * Exposed by the `GET /api/v1/admin/ai-metrics` endpoint (Phase 11).
   */
  summary(): AiMetricsSummary {
    return {
      totalCalls: this.totalCalls,
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      estimatedCostUsd: Number(this.totalCostUsd.toFixed(6)),
      cacheHitRate: this.totalCalls === 0 ? 0 : this.cacheHits / this.totalCalls,
      fallbackRate: this.totalCalls === 0 ? 0 : this.fallbacks / this.totalCalls,
      avgLatencyMs: this.totalCalls === 0 ? 0 : Math.round(this.totalLatencyMs / this.totalCalls),
    };
  }

  /** Reset all counters (useful in tests). */
  reset(): void {
    this.totalCalls = 0;
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
    this.totalCostUsd = 0;
    this.cacheHits = 0;
    this.fallbacks = 0;
    this.totalLatencyMs = 0;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const rates = COST_PER_M_TOKENS[model] ?? { input: 0, output: 0 };
    return (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000;
  }
}

/** Singleton — accumulates metrics for the lifetime of the process. */
export const aiMetrics = new AiMetricsService();
