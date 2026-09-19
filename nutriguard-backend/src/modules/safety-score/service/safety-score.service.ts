import { safetyScoreRepository, SafetyScoreRepository } from '../repository/safety-score.repository.js';
import type { IngredientRiskInput, SafetyScoreResult, ScoreDeduction } from '../types/safety-score.types.js';
import type { RiskLevel } from '@shared/constants/index.js';

const SCORING_VERSION = 'v1';

/** Points deducted per flagged ingredient, by risk level — see AI Agent LLD §9 "Weightages". */
const DEDUCTION_WEIGHTS: Record<RiskLevel, number> = {
  high: 15,
  moderate: 6,
  safe: 0,
  unknown: 0,
};

/** Score thresholds mapping to a verdict — AI Agent LLD §9/§10. */
const VERDICT_THRESHOLDS: { min: number; verdict: RiskLevel }[] = [
  { min: 80, verdict: 'safe' },
  { min: 55, verdict: 'moderate' },
  { min: 0, verdict: 'high' },
];

/**
 * Deterministic, auditable safety-score calculator. Deliberately contains
 * ZERO calls to an LLM — per the project's core requirement ("always
 * prioritize structured knowledge... prefer deterministic database
 * information over model memory"), the score itself is plain arithmetic
 * over risk levels already classified in the `ingredients` table. The AI
 * only ever explains the score after the fact (Summary Agent, Phase 10);
 * it never computes or overrides it.
 */
export class SafetyScoreService {
  constructor(private readonly repository: SafetyScoreRepository = safetyScoreRepository) {}

  /** Pure function — no I/O — so it's trivially unit-testable without mocking anything. */
  calculate(ingredients: IngredientRiskInput[]): SafetyScoreResult {
    if (ingredients.length === 0) {
      return {
        score: 0,
        verdict: 'unknown',
        ingredient_count: 0,
        flagged_count: 0,
        scoring_version: SCORING_VERSION,
        breakdown: { base_score: 100, deductions: [] },
      };
    }

    const deductions: ScoreDeduction[] = [];
    let flaggedCount = 0;

    for (const ingredient of ingredients) {
      const weight = DEDUCTION_WEIGHTS[ingredient.riskLevel];
      if (weight > 0) {
        flaggedCount += 1;
        deductions.push({
          reason: `${ingredient.name} classified as ${ingredient.riskLevel} risk`,
          points: weight,
          ingredient_id: ingredient.ingredientId,
        });
      }
    }

    const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
    const score = Math.max(0, 100 - totalDeduction);
    const verdict = VERDICT_THRESHOLDS.find((t) => score >= t.min)?.verdict ?? 'high';

    return {
      score,
      verdict,
      ingredient_count: ingredients.length,
      flagged_count: flaggedCount,
      scoring_version: SCORING_VERSION,
      breakdown: { base_score: 100, deductions },
    };
  }

  async persist(scanId: string, result: SafetyScoreResult): Promise<void> {
    await this.repository.create({
      scanId,
      score: result.score,
      verdict: result.verdict,
      ingredientCount: result.ingredient_count,
      flaggedCount: result.flagged_count,
      scoringVersion: result.scoring_version,
    });
  }

  async getByScanId(scanId: string) {
    return this.repository.findByScanId(scanId);
  }
}

export const safetyScoreService = new SafetyScoreService();
