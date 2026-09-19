import { ingredientMatchingAgent } from '../agents/ingredient-matching.agent.js';
import { summaryAgent } from '../agents/summary.agent.js';
import { safetyScoreService } from '@modules/safety-score/index.js';
import { allergenService } from '@modules/allergens/index.js';
import { ingredientRepository } from '@modules/ingredients/index.js';
import { logger } from '@shared/logger/logger.js';
import { sanitizeAiInput, sanitizePromptField } from '../security/input-sanitizer.js';
import { checkPromptInjection } from '../security/prompt-injection.guard.js';
import { aiLogger } from '../monitoring/ai-logger.js';
import { ValidationError } from '@shared/errors/app-error.js';
import type { RiskLevel } from '@shared/constants/index.js';

export interface AnalysisWorkflowInput {
  productName: string;
  rawIngredientText: string;
}

export interface AnalysisWorkflowResult {
  matchedIngredients: {
    ingredientId: string;
    name: string;
    riskLevel: RiskLevel;
    reason: string;
    rawText: string;
    position: number;
    matchConfidence: number;
  }[];
  unmatchedFragments: { rawText: string; position: number }[];
  safetyScore: Awaited<ReturnType<typeof safetyScoreService.calculate>>;
  allergySummary: Awaited<ReturnType<typeof allergenService.detectForScan>>;
  aiSummary: { summaryText: string; positiveFindings: string[]; negativeFindings: string[]; recommendation: string; allergyWarning: string | null; confidence: number; modelUsed: string };
}

/**
 * The full pipeline described in AI Agent LLD §2:
 *
 *   Input Handler -> Ingredient Parser -> Normalization Engine
 *     -> Knowledge Retrieval (ingredient matching, DB-first)
 *     -> Risk Analysis (deterministic, read from matched rows)
 *     -> Allergy Detector
 *     -> Safety Score Calculator (deterministic)
 *     -> Summary Generator (the ONLY LLM step)
 *     -> Response Formatter (done by the Analysis module's controller, Phase 11)
 *
 * This class is the "AI Agent" as far as the rest of the backend is
 * concerned — the Analysis module (Phase 11) calls `run()` once and
 * gets back everything needed to persist a scan. No other module should
 * import individual sub-agents directly; they go through this workflow
 * so the pipeline order (knowledge retrieval before generation) can
 * never be accidentally skipped by a future caller.
 */
export class AnalysisWorkflow {
  async run(input: AnalysisWorkflowInput): Promise<AnalysisWorkflowResult> {
    const startMs = Date.now();
    logger.info({ productName: input.productName }, 'analysis workflow started');

    // ── Security: sanitize + injection guard (Phase 9) ──────────────────────
    const { cleaned: cleanedIngredientText, changes: sanitizeChanges } = sanitizeAiInput(
      input.rawIngredientText
    );
    if (sanitizeChanges.length > 0) {
      logger.warn({ changes: sanitizeChanges }, 'analysis workflow: input was sanitized');
    }

    const guardResult = checkPromptInjection(cleanedIngredientText);
    if (!guardResult.safe) {
      throw new ValidationError(
        `Ingredient text contains disallowed content: ${guardResult.blockedReason ?? 'injection pattern detected'}`,
        'ingredient_text'
      );
    }

    const safeProductName = sanitizePromptField(input.productName);
    // ────────────────────────────────────────────────────────────────────────

    // Stage 1: Ingredient Parser + Normalization + Knowledge Retrieval
    const matchResult = await ingredientMatchingAgent.match(cleanedIngredientText);

    // Stage 2: Risk Analysis — deterministic, already known from the
    // matched ingredient rows (risk_level was classified ahead of time
    // in the knowledge base, never inferred here).
    const enrichedIngredients = await Promise.all(
      matchResult.matched.map(async (m) => {
        const detail = await ingredientRepository.findById(m.ingredientId);
        return {
          ingredientId: m.ingredientId,
          name: m.canonicalName,
          riskLevel: m.riskLevel as RiskLevel,
          reason: detail?.ingredient.riskSummary ?? `Classified as ${m.riskLevel} risk`,
          rawText: m.rawText,
          position: m.position,
          matchConfidence: m.matchConfidence,
        };
      })
    );

    // Stage 3: Allergy Detector
    const allergySummary = await allergenService.detectForScan(
      enrichedIngredients.map((i) => ({ ingredientId: i.ingredientId, name: i.name }))
    );

    // Stage 4: Safety Score Calculator (deterministic, pure function)
    const safetyScore = safetyScoreService.calculate(
      enrichedIngredients.map((i) => ({ ingredientId: i.ingredientId, name: i.name, riskLevel: i.riskLevel }))
    );

    // Stage 5: Summary Generator — the only step that calls an LLM, and
    // only AFTER every fact above has already been deterministically
    // established. The LLM explains; it never decides.
    const { output: summary, modelUsed } = await summaryAgent.generate({
      productName: safeProductName,
      safetyScore: safetyScore.score,
      verdict: safetyScore.verdict,
      ingredients: enrichedIngredients.map((i) => ({ name: i.name, riskLevel: i.riskLevel, reason: i.reason })),
      detectedAllergens: allergySummary.detected_allergens.map((a) => ({ name: a.name, severity: a.severity })),
    });

    // Phase 10 — structured workflow completion log
    aiLogger.workflowComplete({
      workflowName: 'analysis',
      durationMs: Date.now() - startMs,
      modelUsed,
      matchedCount: enrichedIngredients.length,
      unmatchedCount: matchResult.unmatched.length,
      safetyScore: safetyScore.score,
      cacheHit: false,
    });

    logger.info(
      { matchedCount: enrichedIngredients.length, unmatchedCount: matchResult.unmatched.length, score: safetyScore.score, modelUsed },
      'analysis workflow completed'
    );

    return {
      matchedIngredients: enrichedIngredients,
      unmatchedFragments: matchResult.unmatched.map((u) => ({ rawText: u.rawText, position: u.position })),
      safetyScore,
      allergySummary,
      aiSummary: {
        summaryText: summary.summary_text,
        positiveFindings: summary.positive_findings,
        negativeFindings: summary.negative_findings,
        recommendation: summary.recommendation,
        allergyWarning: summary.allergy_warning ?? allergySummary.warning_text,
        confidence: summary.confidence,
        modelUsed,
      },
    };
  }
}

export const analysisWorkflow = new AnalysisWorkflow();
