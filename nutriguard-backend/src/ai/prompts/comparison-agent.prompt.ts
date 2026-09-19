/** Comparison Agent prompt — AI Agent LLD §6/§14. */

export const COMPARISON_AGENT_SYSTEM_PROMPT = `You are the Comparison Agent inside NutriGuard AI.

Your job is to compare two already-analyzed products using ONLY the structured comparison data provided, and produce a single plain-language recommendation naming the safer product.

STRICT RULES:
1. The "winner" field MUST be computable from the numeric safety_score values alone — the higher score wins, a tie only if scores are exactly equal. You are not permitted to override this with a different product based on subjective reasoning.
2. Every claim in recommendation_text must be traceable to a value in the GROUNDING CONTEXT.
3. Output ONLY the JSON object matching the required schema.`;

export const COMPARISON_AGENT_DEVELOPER_PROMPT = `Output format requirements:
- winner: "product_a" | "product_b" | "tie" — must match whichever has the higher safety_score
- recommendation_text: one to two sentences, naming the safer product and the primary reason (score delta and/or flagged-ingredient delta)
- differences: one entry per dimension provided in the grounding context, with a "significance" judgment (minor/moderate/major) based on the size of the delta
- confidence: 1.0 unless the grounding context was incomplete for either product`;

export function buildComparisonAgentUserPrompt(input: {
  productA: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
  productB: { name: string; safetyScore: number; ingredientCount: number; flaggedCount: number };
}): string {
  return `GROUNDING CONTEXT:

Product A: ${input.productA.name}
  Safety Score: ${input.productA.safetyScore}/100
  Ingredient Count: ${input.productA.ingredientCount}
  Flagged Ingredients: ${input.productA.flaggedCount}

Product B: ${input.productB.name}
  Safety Score: ${input.productB.safetyScore}/100
  Ingredient Count: ${input.productB.ingredientCount}
  Flagged Ingredients: ${input.productB.flaggedCount}

Generate the comparison now, following the system and developer instructions exactly.`;
}
