import type { RiskLevel } from '@shared/constants/index.js';

export interface IngredientRiskInput {
  ingredientId: string;
  name: string;
  riskLevel: RiskLevel;
}

export interface ScoreDeduction {
  reason: string;
  points: number;
  ingredient_id: string | null;
}

export interface SafetyScoreResult {
  score: number;
  verdict: RiskLevel;
  ingredient_count: number;
  flagged_count: number;
  scoring_version: string;
  breakdown: {
    base_score: 100;
    deductions: ScoreDeduction[];
  };
}
