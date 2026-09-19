import { alternativeRepository, AlternativeRepository } from '../repository/alternative.repository.js';

export interface AlternativeView {
  id: string;
  name: string;
  reason: string;
  score_delta: number;
  confidence: number;
  is_catalogued: boolean;
}

/**
 * Implements the AI Agent LLD §12 Alternative Recommendation Engine
 * selection/ranking rules at the data-access layer (the AI Agent's
 * Alternative Recommendation Agent calls this service rather than
 * querying the table directly — single source of truth for "how do we
 * rank alternatives" regardless of whether the caller is a REST client
 * or the AI orchestrator building LLM context).
 */
export class AlternativeService {
  constructor(private readonly repository: AlternativeRepository = alternativeRepository) {}

  async getAlternatives(ingredientId: string, limit = 3): Promise<AlternativeView[]> {
    const rows = await this.repository.findByIngredientId(ingredientId);

    return rows.slice(0, limit).map((row) => {
      const isCatalogued = row.alternativeIngredient !== null;
      return {
        id: row.alternative.id,
        name: isCatalogued ? (row.alternativeIngredient?.name ?? row.alternative.altProductName ?? 'Unknown') : (row.alternative.altProductName ?? 'Unknown'),
        reason: row.alternative.reason,
        score_delta: row.alternative.scoreDelta,
        // Confidence is higher for catalogued-ingredient alternatives
        // (grounded in structured data) than free-text product-name
        // alternatives (looser match) — mirrors AI Agent LLD §16
        // Confidence Scoring's "knowledge confidence" factor.
        confidence: isCatalogued ? 0.9 : 0.6,
        is_catalogued: isCatalogued,
      };
    });
  }
}

export const alternativeService = new AlternativeService();
