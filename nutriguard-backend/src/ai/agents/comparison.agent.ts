import { llmClient } from '../clients/llm-orchestration.client.js';
import { validateStructuredOutput } from '../validators/response-validator.js';
import { comparisonAgentOutputSchema, comparisonAgentJsonSchema, type ComparisonAgentOutput } from '../schemas/index.js';
import { COMPARISON_AGENT_SYSTEM_PROMPT, COMPARISON_AGENT_DEVELOPER_PROMPT, buildComparisonAgentUserPrompt } from '../prompts/index.js';
import { logger } from '@shared/logger/logger.js';

export interface ComparisonAgentInput {
  productA: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
  productB: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
}

function computeDeterministicWinner(input: ComparisonAgentInput): 'product_a' | 'product_b' | 'tie' {
  if (input.productA.safetyScore > input.productB.safetyScore) return 'product_a';
  if (input.productB.safetyScore > input.productA.safetyScore) return 'product_b';
  return 'tie';
}

function buildFallbackComparison(input: ComparisonAgentInput): ComparisonAgentOutput {
  const winner = computeDeterministicWinner(input);
  const winnerName = winner === 'product_a' ? input.productA.name : winner === 'product_b' ? input.productB.name : null;
  return {
    winner,
    recommendation_text: winnerName
      ? `${winnerName} is the safer choice based on safety score.`
      : 'Both products scored equally on safety.',
    differences: [
      {
        dimension: 'safety_score',
        product_a_value: input.productA.safetyScore,
        product_b_value: input.productB.safetyScore,
        significance: Math.abs(input.productA.safetyScore - input.productB.safetyScore) > 20 ? 'major' : 'moderate',
      },
    ],
    confidence: 0.5,
  };
}

export class ComparisonAgent {
  async generate(input: ComparisonAgentInput): Promise<{ output: ComparisonAgentOutput; modelUsed: string }> {
    try {
      const { result, modelUsed } = await llmClient.generateStructured<unknown>({
        systemPrompt: COMPARISON_AGENT_SYSTEM_PROMPT,
        userPrompt: buildComparisonAgentUserPrompt(input) + '\n\n' + COMPARISON_AGENT_DEVELOPER_PROMPT,
        jsonSchema: comparisonAgentJsonSchema,
        schemaName: 'comparison_agent_output',
      });

      const validated = validateStructuredOutput(comparisonAgentOutputSchema, result);

      // Guardrail (AI Agent LLD §17 Response Validation "Consistency"):
      // the LLM's stated winner MUST match the deterministic score
      // comparison. If it doesn't, the LLM's phrasing is trusted for
      // *why*, never for *which* — the winner field is overwritten.
      const deterministicWinner = computeDeterministicWinner(input);
      if (validated.winner !== deterministicWinner) {
        logger.warn(
          { llmWinner: validated.winner, deterministicWinner },
          'Comparison Agent: LLM winner disagreed with deterministic score comparison — overriding'
        );
        validated.winner = deterministicWinner;
      }

      return { output: validated, modelUsed };
    } catch (err) {
      logger.error({ err }, 'Comparison Agent: LLM generation failed — using deterministic fallback');
      return { output: buildFallbackComparison(input), modelUsed: 'fallback-template' };
    }
  }
}

export const comparisonAgent = new ComparisonAgent();
