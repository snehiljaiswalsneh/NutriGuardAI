import { productRepository, ProductRepository } from '../repository/product.repository.js';
import { scanRepository, ScanRepository } from '../repository/scan.repository.js';
import { safetyScoreService } from '@modules/safety-score/index.js';
import { alternativeService } from '@modules/alternatives/index.js';
import { analysisWorkflow } from '@ai/index.js';
import { NotFoundError } from '@shared/errors/app-error.js';
import { logger } from '@shared/logger/logger.js';
import { toDashboardDto, type DashboardIngredientRow } from '../dto/analysis.dto.js';
import type { TriggerAnalysisRequest } from '../validator/analysis.validator.js';

/**
 * The Analysis module is intentionally thin — nearly every real decision
 * (matching, scoring, summarizing) already lives in `AnalysisWorkflow`
 * (the AI Agent) or the Safety Score / Allergen services. This service's
 * job is purely: create the product/scan rows, invoke the workflow,
 * persist its result, and shape the read model — matching the Backend
 * Folder Structure's "keep controllers thin, business logic in
 * services, but the AI Agent owns AI reasoning" separation of concerns.
 */
export class AnalysisService {
  constructor(
    private readonly products: ProductRepository = productRepository,
    private readonly scans: ScanRepository = scanRepository
  ) {}

  /**
   * Synchronous in this implementation (no background queue infra yet —
   * see README "Next Steps"). The API Specification's `202 Accepted` +
   * poll contract is still honored from the client's point of view: the
   * controller returns immediately after this resolves, and a client
   * that polls `GET /scans/{id}` before this finishes would simply see
   * `status: "processing"` on a sufficiently large ingredient list.
   */
  async triggerAnalysis(userId: string, input: TriggerAnalysisRequest): Promise<{ scanId: string }> {
    const brandId = input.brand_name ? await this.products.findOrCreateBrand(input.brand_name) : null;

    const productId = await this.products.create({
      brandId,
      name: input.product_name ?? 'Unnamed product',
      rawIngredientText: input.ingredient_text,
      createdBy: userId,
    });

    const scanId = await this.scans.create({
      userId,
      productId,
      status: 'processing',
      inputSource: input.input_source,
    });

    try {
      const result = await analysisWorkflow.run({
        productName: input.product_name ?? 'Unnamed product',
        rawIngredientText: input.ingredient_text,
      });

      await this.products.saveProductIngredients(
        result.matchedIngredients.map((m) => ({
          productId,
          ingredientId: m.ingredientId,
          rawText: m.rawText,
          position: m.position,
          matchConfidence: String(m.matchConfidence),
        }))
      );

      await safetyScoreService.persist(scanId, result.safetyScore);

      await this.scans.saveAiSummary({
        scanId,
        summaryText: result.aiSummary.summaryText,
        allergyWarning: result.aiSummary.allergyWarning,
        modelName: result.aiSummary.modelUsed,
      });

      await this.scans.updateStatus(scanId, 'completed');
    } catch (err) {
      logger.error({ err, scanId }, 'analysis pipeline failed');
      await this.scans.updateStatus(scanId, 'failed', 'Analysis pipeline encountered an unexpected error');
      // Deliberately do not re-throw: the scan row itself was created
      // successfully and now correctly reflects `status: "failed"` —
      // the client's subsequent GET will see that status rather than a
      // 500, matching AI Agent LLD §18's "always leave the system in an
      // explainable state" error-handling principle.
    }

    return { scanId };
  }

  async getDashboard(scanId: string, userId: string) {
    const payload = await this.scans.findOwnedOrThrow(scanId, userId);

    const breakdownRows = await this.products.findIngredientBreakdown(payload.product.id);
    const ingredientRows: DashboardIngredientRow[] = breakdownRows.map((r) => ({
      ingredient_id: r.ingredient?.id ?? null,
      name: r.ingredient?.name ?? r.productIngredient.rawText,
      risk_level: r.ingredient?.riskLevel ?? 'unknown',
      reason: r.ingredient?.riskSummary ?? 'Not matched to a catalogued ingredient',
    }));

    return toDashboardDto(payload, ingredientRows, payload.aiSummary?.allergyWarning ?? null);
  }

  async getSafetyScore(scanId: string, userId: string) {
    await this.scans.findOwnedOrThrow(scanId, userId);
    const score = await safetyScoreService.getByScanId(scanId);
    if (!score) throw new NotFoundError('Safety score for scan', scanId);
    return score;
  }

  async getAiSummary(scanId: string, userId: string) {
    const payload = await this.scans.findOwnedOrThrow(scanId, userId);
    if (!payload.aiSummary) throw new NotFoundError('AI summary for scan', scanId);
    return payload.aiSummary;
  }

  async getRecommendations(scanId: string, userId: string) {
    const payload = await this.scans.findOwnedOrThrow(scanId, userId);
    const breakdownRows = await this.products.findIngredientBreakdown(payload.product.id);

    const flaggedIngredientIds = breakdownRows
      .filter((r) => r.ingredient && (r.ingredient.riskLevel === 'high' || r.ingredient.riskLevel === 'moderate'))
      .map((r) => r.ingredient!.id);

    const recommendations = await Promise.all(
      flaggedIngredientIds.map((id) => alternativeService.getAlternatives(id, 1))
    );

    return recommendations.flat();
  }

  async getConsumptionAdvice(scanId: string, userId: string) {
    const payload = await this.scans.findOwnedOrThrow(scanId, userId);
    if (!payload.safetyScore) throw new NotFoundError('Safety score for scan', scanId);

    // Deterministic, template-based advice derived from the verdict —
    // deliberately NOT a fresh LLM call, since the AI Summary already
    // covers open-ended explanation; this endpoint provides a stable,
    // consistent action statement (AI Agent LLD §15 "Recommendations").
    const advice: Record<string, string> = {
      safe: 'This product appears safe for regular consumption based on current ingredient data.',
      moderate: 'Occasional consumption is likely fine, but consider the flagged ingredients if consumed frequently.',
      high: 'Consider limiting consumption or choosing a safer alternative due to the high-risk ingredients detected.',
      unknown: 'Not enough ingredient data was matched to provide confident consumption guidance.',
    };

    return { advice: advice[payload.safetyScore.verdict] ?? advice.unknown };
  }

  async deleteScan(scanId: string, userId: string): Promise<void> {
    await this.scans.deleteById(scanId, userId);
  }
}

export const analysisService = new AnalysisService();
