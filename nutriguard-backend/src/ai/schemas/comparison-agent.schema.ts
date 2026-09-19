import { z } from 'zod';

/** Mirrors `schemas/comparison-agent.output.schema.json` from the AI Agent LLD. */
export const comparisonAgentOutputSchema = z.object({
  winner: z.enum(['product_a', 'product_b', 'tie']),
  recommendation_text: z.string().max(300),
  differences: z.array(
    z.object({
      dimension: z.enum(['safety_score', 'ingredient_count', 'flagged_ingredient_count', 'allergen_overlap']),
      product_a_value: z.union([z.string(), z.number()]),
      product_b_value: z.union([z.string(), z.number()]),
      significance: z.enum(['minor', 'moderate', 'major']),
    })
  ),
  confidence: z.number().min(0).max(1),
});
export type ComparisonAgentOutput = z.infer<typeof comparisonAgentOutputSchema>;

export const comparisonAgentJsonSchema = {
  type: 'object',
  required: ['winner', 'recommendation_text', 'differences', 'confidence'],
  additionalProperties: false,
  properties: {
    winner: { type: 'string', enum: ['product_a', 'product_b', 'tie'] },
    recommendation_text: { type: 'string', maxLength: 300 },
    differences: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dimension', 'product_a_value', 'product_b_value', 'significance'],
        properties: {
          dimension: { type: 'string', enum: ['safety_score', 'ingredient_count', 'flagged_ingredient_count', 'allergen_overlap'] },
          product_a_value: {},
          product_b_value: {},
          significance: { type: 'string', enum: ['minor', 'moderate', 'major'] },
        },
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;
