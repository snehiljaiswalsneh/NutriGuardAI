import { llmClient } from '../clients/llm-orchestration.client.js';
import { validateStructuredOutput } from '../validators/response-validator.js';
import { summaryAgentOutputSchema, summaryAgentJsonSchema, type SummaryAgentOutput } from '../schemas/index.js';
import { SUMMARY_AGENT_SYSTEM_PROMPT, SUMMARY_AGENT_DEVELOPER_PROMPT, buildSummaryAgentUserPrompt } from '../prompts/index.js';
import { logger } from '@shared/logger/logger.js';

export interface SummaryAgentInput {
  productName: string;
  safetyScore: number;
  verdict: string;
  ingredients: { name: string; riskLevel: string; reason: string }[];
  detectedAllergens: { name: string; severity: string }[];
}

/** Deterministic fallback used only if BOTH LLM providers fail — AI Agent LLD §18 Error Handling. */
function buildFallbackSummary(input: SummaryAgentInput): SummaryAgentOutput {
  const flagged = input.ingredients.filter((i) => i.riskLevel === 'high' || i.riskLevel === 'moderate');
  return {
    summary_text: `This product scored ${input.safetyScore}/100 (${input.verdict} risk) based on ${input.ingredients.length} analyzed ingredients, ${flagged.length} of which were flagged.`,
    positive_findings: flagged.length === 0 ? ['No high or moderate risk ingredients detected'] : [],
    negative_findings: flagged.map((f) => `${f.name}: ${f.reason}`),
    recommendation:
      flagged.length > 0 ? 'Consider reviewing the flagged ingredients before regular consumption.' : 'No specific concerns identified.',
    allergy_warning: input.detectedAllergens.length > 0 ? `Contains ${input.detectedAllergens.map((a) => a.name).join(', ')}.` : null,
    confidence: 0.5, // Lower confidence — this is a template, not an LLM-reasoned summary.
  };
}

export class SummaryAgent {
  async generate(input: SummaryAgentInput): Promise<{ output: SummaryAgentOutput; modelUsed: string }> {
    const userPrompt =
      buildSummaryAgentUserPrompt({
        productName: input.productName,
        safetyScore: input.safetyScore,
        verdict: input.verdict,
        ingredients: input.ingredients,
        detectedAllergens: input.detectedAllergens,
      }) +
      '\n\n' +
      SUMMARY_AGENT_DEVELOPER_PROMPT;

    try {
      const { result, modelUsed } = await llmClient.generateStructured<unknown>({
        systemPrompt: SUMMARY_AGENT_SYSTEM_PROMPT,
        userPrompt,
        jsonSchema: summaryAgentJsonSchema,
        schemaName: 'summary_agent_output',
      });

      const validated = validateStructuredOutput(summaryAgentOutputSchema, result, {
        knownIngredientNames: input.ingredients.map((i) => i.name),
      });

      return { output: validated, modelUsed };
    } catch (err) {
      logger.error({ err }, 'Summary Agent: both LLM providers failed or output failed validation — using deterministic fallback');
      return { output: buildFallbackSummary(input), modelUsed: 'fallback-template' };
    }
  }
}

export const summaryAgent = new SummaryAgent();
