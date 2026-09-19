import { comparisonAgent } from '../agents/comparison.agent.js';
import { logger } from '@shared/logger/logger.js';

export interface ComparisonWorkflowInput {
  productA: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
  productB: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
}

/**
 * Thin workflow wrapper (AI Agent LLD §14 Product Comparison Engine) —
 * kept as its own workflow, separate from `AnalysisWorkflow`, since
 * comparison operates on two ALREADY-ANALYZED scans rather than raw
 * ingredient text; it has no knowledge-retrieval stage of its own.
 */
export class ComparisonWorkflow {
  async run(input: ComparisonWorkflowInput) {
    logger.info({ a: input.productA.name, b: input.productB.name }, 'comparison workflow started');
    const { output, modelUsed } = await comparisonAgent.generate(input);
    logger.info({ winner: output.winner, modelUsed }, 'comparison workflow completed');
    return { ...output, modelUsed };
  }
}

export const comparisonWorkflow = new ComparisonWorkflow();
