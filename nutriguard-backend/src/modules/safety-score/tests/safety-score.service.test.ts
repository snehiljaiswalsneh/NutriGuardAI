import { describe, it, expect } from 'vitest';
import { SafetyScoreService } from '../service/safety-score.service.js';

describe('SafetyScoreService.calculate', () => {
  const service = new SafetyScoreService();

  it('returns a perfect score with no deductions when all ingredients are safe', () => {
    const result = service.calculate([
      { ingredientId: '1', name: 'Water', riskLevel: 'safe' },
      { ingredientId: '2', name: 'Citric Acid', riskLevel: 'safe' },
    ]);
    expect(result.score).toBe(100);
    expect(result.verdict).toBe('safe');
    expect(result.flagged_count).toBe(0);
    expect(result.breakdown.deductions).toHaveLength(0);
  });

  it('deducts 15 points per high-risk ingredient and 6 per moderate-risk ingredient', () => {
    const result = service.calculate([
      { ingredientId: '1', name: 'Sodium Nitrite', riskLevel: 'high' },
      { ingredientId: '2', name: 'Tartrazine', riskLevel: 'moderate' },
      { ingredientId: '3', name: 'Citric Acid', riskLevel: 'safe' },
    ]);
    expect(result.score).toBe(100 - 15 - 6);
    expect(result.verdict).toBe('moderate');
    expect(result.flagged_count).toBe(2);
    expect(result.breakdown.deductions).toHaveLength(2);
  });

  it('never returns a score below 0 even with many high-risk ingredients', () => {
    const manyHighRisk = Array.from({ length: 10 }, (_, i) => ({
      ingredientId: String(i),
      name: `Ingredient ${i}`,
      riskLevel: 'high' as const,
    }));
    const result = service.calculate(manyHighRisk);
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('high');
  });

  it('classifies verdict thresholds correctly at the boundaries', () => {
    // score = 100 - 15 = 85 -> safe (>= 80)
    expect(
      service.calculate([{ ingredientId: '1', name: 'X', riskLevel: 'high' }]).verdict
    ).toBe('safe');

    // score = 100 - 15*3 = 55 -> moderate (>= 55)
    const threeHighRisk = Array.from({ length: 3 }, (_, i) => ({
      ingredientId: String(i),
      name: `Ingredient ${i}`,
      riskLevel: 'high' as const,
    }));
    expect(service.calculate(threeHighRisk).verdict).toBe('moderate');

    // score = 100 - 15*4 = 40 -> high (< 55)
    const fourHighRisk = Array.from({ length: 4 }, (_, i) => ({
      ingredientId: String(i),
      name: `Ingredient ${i}`,
      riskLevel: 'high' as const,
    }));
    expect(service.calculate(fourHighRisk).verdict).toBe('high');
  });

  it('returns an unknown/zero result for an empty ingredient list rather than throwing', () => {
    const result = service.calculate([]);
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('unknown');
    expect(result.ingredient_count).toBe(0);
  });
});
