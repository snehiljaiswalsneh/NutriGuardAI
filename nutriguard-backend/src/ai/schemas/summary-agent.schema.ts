import { z } from 'zod';

/**
 * Mirrors `schemas/summary-agent.output.schema.json` from the AI Agent
 * LLD exactly — this is the JSON Schema handed to OpenAI's Structured
 * Outputs / used to instruct Claude, AND the Zod schema used to validate
 * whichever provider answered (AI Agent LLD §17 Response Validation).
 */
export const summaryAgentOutputSchema = z.object({
  summary_text: z.string().max(600),
  positive_findings: z.array(z.string().max(200)),
  negative_findings: z.array(z.string().max(200)),
  recommendation: z.string().max(250),
  allergy_warning: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
export type SummaryAgentOutput = z.infer<typeof summaryAgentOutputSchema>;

/** JSON Schema form, for providers that want the raw schema (OpenAI Structured Outputs). */
export const summaryAgentJsonSchema = {
  type: 'object',
  required: ['summary_text', 'positive_findings', 'negative_findings', 'recommendation', 'allergy_warning', 'confidence'],
  additionalProperties: false,
  properties: {
    summary_text: { type: 'string', maxLength: 600 },
    positive_findings: { type: 'array', items: { type: 'string', maxLength: 200 } },
    negative_findings: { type: 'array', items: { type: 'string', maxLength: 200 } },
    recommendation: { type: 'string', maxLength: 250 },
    allergy_warning: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;
