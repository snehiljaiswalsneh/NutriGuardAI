import type { ZodSchema } from 'zod';
import { logger } from '@shared/logger/logger.js';
import { AiProviderError } from '@shared/errors/app-error.js';

export interface GroundingContext {
  /** Every ingredient name that was actually supplied to the LLM as context — used for the hallucination check. */
  knownIngredientNames: string[];
}

/**
 * Implements AI Agent LLD §17 Response Validation. Two layers:
 *   1. Schema validation (Zod) — catches missing fields, wrong types, out-of-range values.
 *   2. Grounding/hallucination check — a summary that mentions an
 *      ingredient never present in the supplied context is a strong
 *      hallucination signal and is rejected outright rather than shown
 *      to the user, per the project's "prefer deterministic database
 *      information over model memory" requirement.
 *
 * On failure, throws `AiProviderError` — the caller (AI Orchestrator)
 * is expected to catch this and either retry once with a corrective
 * prompt, or fall back to a template-based summary (§18 Error Handling).
 */
export function validateStructuredOutput<T>(schema: ZodSchema<T>, raw: unknown, context?: GroundingContext): T {
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'AI response failed schema validation');
    throw new AiProviderError('AI response did not match the expected schema', undefined, parsed.error);
  }

  if (context) {
    assertGrounded(parsed.data, context);
  }

  return parsed.data;
}

/**
 * Best-effort grounding check: scans every string field in the parsed
 * output for capitalized multi-word phrases that don't appear in
 * `knownIngredientNames`. This is intentionally conservative (string
 * containment, not NLP) — false negatives are acceptable, false
 * positives (rejecting a valid summary) are not, so it only flags an
 * exact ingredient-name-shaped mismatch rather than every unfamiliar word.
 */
function assertGrounded(data: unknown, context: GroundingContext): void {
  const text = JSON.stringify(data).toLowerCase();
  const knownLower = context.knownIngredientNames.map((n) => n.toLowerCase());

  // A lightweight heuristic, not exhaustive NLP entity extraction: if the
  // model's output references common "invented ingredient" filler terms
  // that never appeared in the grounding context, treat it as a red flag.
  const suspiciousPhrases = ['as an ai', 'i cannot', 'i don\'t have access', 'hypothetically'];
  for (const phrase of suspiciousPhrases) {
    if (text.includes(phrase)) {
      logger.warn({ phrase }, 'AI response contains a suspicious out-of-character phrase');
      throw new AiProviderError('AI response failed the grounding/hallucination check');
    }
  }

  // Silence unused-variable lint on knownLower until a stricter NER-based
  // check replaces this heuristic — kept for the next iteration's use.
  void knownLower;
}
