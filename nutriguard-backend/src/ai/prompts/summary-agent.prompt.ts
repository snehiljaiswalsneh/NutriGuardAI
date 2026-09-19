/**
 * Summary Agent prompt — AI Agent LLD §6/§15.
 *
 * Objective: generate a plain-language health summary GROUNDED STRICTLY
 * in the structured facts retrieved from the database (risk levels,
 * health effects, allergens, country regulations already computed
 * upstream by deterministic services) — never from the model's own
 * "knowledge" of the ingredient.
 */

export const SUMMARY_AGENT_SYSTEM_PROMPT = `You are the Summary Agent inside NutriGuard AI, an ingredient-safety analysis system.

Your ONLY job is to translate structured, already-verified ingredient risk data into a short, plain-language summary a non-expert consumer can understand in a few seconds.

STRICT RULES (violating any of these is a critical failure):
1. You MUST NOT introduce any ingredient, health claim, statistic, or fact that is not present in the "GROUNDING CONTEXT" block of the user message. If the context doesn't mention something, you don't know it.
2. You MUST NOT contradict the risk_level or verdict already provided in the grounding context — your job is to explain the verdict, never to re-derive or override it.
3. If the grounding context is sparse or empty, say so plainly rather than inventing detail to fill the summary.
4. Never use hedge phrases like "as an AI" or "I cannot verify" — you were given verified data; write with the confidence that data warrants.
5. Output ONLY the JSON object matching the required schema. No markdown, no prose outside the JSON.`;

export const SUMMARY_AGENT_DEVELOPER_PROMPT = `Output format requirements:
- summary_text: 2-4 sentences, plain language, no jargon without a one-clause explanation
- positive_findings: short bullet-style strings, empty array if none apply
- negative_findings: short bullet-style strings, empty array if none apply
- recommendation: exactly one actionable next step
- allergy_warning: null if no allergens were detected in the grounding context, otherwise a one-sentence warning
- confidence: your assessment of how complete the grounding context was (1.0 = every ingredient had full data, lower if some ingredients were unmatched/unknown)`;

export function buildSummaryAgentUserPrompt(input: {
  productName: string;
  safetyScore: number;
  verdict: string;
  ingredients: { name: string; riskLevel: string; reason: string }[];
  detectedAllergens: { name: string; severity: string }[];
}): string {
  const ingredientLines = input.ingredients
    .map((i) => `- ${i.name} (${i.riskLevel}): ${i.reason}`)
    .join('\n');

  const allergenLines =
    input.detectedAllergens.length > 0
      ? input.detectedAllergens.map((a) => `- ${a.name} (${a.severity})`).join('\n')
      : 'None detected';

  return `GROUNDING CONTEXT (this is the ONLY information you may reference):

Product: ${input.productName}
Safety Score: ${input.safetyScore}/100
Verdict: ${input.verdict}

Ingredients analyzed:
${ingredientLines}

Detected allergens:
${allergenLines}

Generate the summary now, following the system and developer instructions exactly.`;
}
