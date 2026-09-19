import { comparisonRepository, ComparisonRepository } from '../repository/comparison.repository.js';
import { scanRepository } from '@modules/analysis/index.js';
import { comparisonWorkflow } from '@ai/index.js';
import { ValidationError } from '@shared/errors/app-error.js';

export class ComparisonService {
  constructor(private readonly repository: ComparisonRepository = comparisonRepository) {}

  async compare(userId: string, scanAId: string, scanBId: string) {
    if (scanAId === scanBId) {
      throw new ValidationError('scan_a_id and scan_b_id must be distinct', 'scan_b_id');
    }

    const [scanA, scanB] = await Promise.all([
      scanRepository.findOwnedOrThrow(scanAId, userId),
      scanRepository.findOwnedOrThrow(scanBId, userId),
    ]);

    if (!scanA.safetyScore || !scanB.safetyScore) {
      throw new ValidationError('Both scans must have a completed safety score before they can be compared');
    }

    const result = await comparisonWorkflow.run({
      productA: {
        name: scanA.product.name,
        safetyScore: scanA.safetyScore.score,
        ingredientCount: scanA.safetyScore.ingredientCount,
        flaggedCount: scanA.safetyScore.flaggedCount,
      },
      productB: {
        name: scanB.product.name,
        safetyScore: scanB.safetyScore.score,
        ingredientCount: scanB.safetyScore.ingredientCount,
        flaggedCount: scanB.safetyScore.flaggedCount,
      },
    });

    const comparisonId = await this.repository.create({
      userId,
      scanAId,
      scanBId,
      winner: result.winner,
      recommendationText: result.recommendation_text,
    });

    return { comparisonId, winner: result.winner, recommendationText: result.recommendation_text, differences: result.differences };
  }

  async list(userId: string, page: number, limit: number) {
    return this.repository.findByUser(userId, page, limit);
  }

  async getById(comparisonId: string, userId: string) {
    return this.repository.findOwnedOrThrow(comparisonId, userId);
  }

  async delete(comparisonId: string, userId: string): Promise<void> {
    await this.repository.deleteById(comparisonId, userId);
  }
}

export const comparisonService = new ComparisonService();
