// Workflows
export { analysisWorkflow, AnalysisWorkflow } from './workflows/analysis.workflow.js';
export { comparisonWorkflow, ComparisonWorkflow } from './workflows/comparison.workflow.js';
export type * from './workflows/analysis.workflow.js';
export type * from './workflows/comparison.workflow.js';

// Agents
export { ingredientMatchingAgent, IngredientMatchingAgent } from './agents/ingredient-matching.agent.js';
export { summaryAgent, SummaryAgent } from './agents/summary.agent.js';
export { comparisonAgent, ComparisonAgent } from './agents/comparison.agent.js';

// Clients
export { llmClient, LlmOrchestrationClient } from './clients/llm-orchestration.client.js';
export { geminiClient, GeminiClient } from './clients/gemini.client.js';
export { nvidiaClient, NvidiaClient } from './clients/nvidia.client.js';
export type { StructuredGenerationOptions, StreamGenerationOptions } from './clients/gemini.client.js';

// Phase 3 — Embeddings
export { embeddingService, EmbeddingService } from './embeddings/embedding.service.js';
export { vectorStoreService, VectorStoreService } from './embeddings/vector-store.service.js';
export type { EmbeddingResult, SimilarityResult, UpsertEmbeddingInput } from './embeddings/index.js';

// Phase 4 — Knowledge Retrieval
export { ingredientKnowledgeRetriever, IngredientKnowledgeRetriever } from './retrievers/ingredient-knowledge.retriever.js';
export { contextBuilder, ContextBuilder } from './retrievers/context-builder.js';
export type { IngredientKnowledge, KnowledgeContext } from './retrievers/index.js';

// Phase 7 — Streaming
export { streamToHonoResponse, drainStream } from './streaming/stream-handler.js';
export type { TokenStream } from './streaming/stream-handler.js';

// Phase 8 — Caching
export { promptCache } from './cache/prompt-cache.js';
export { embeddingCache } from './cache/embedding-cache.js';
export { LruCache } from './cache/cache.interface.js';
export type { ICache } from './cache/cache.interface.js';

// Phase 9 — Security
export { checkPromptInjection } from './security/prompt-injection.guard.js';
export { sanitizeAiInput, sanitizePromptField } from './security/input-sanitizer.js';
export type { InjectionGuardResult, SanitizeResult } from './security/index.js';

// Phase 10 — Monitoring
export { aiMetrics, AiMetricsService } from './monitoring/ai-metrics.js';
export { aiLogger } from './monitoring/ai-logger.js';
export type { AiCallMetric, AiMetricsSummary } from './monitoring/index.js';

