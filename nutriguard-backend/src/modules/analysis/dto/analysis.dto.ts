import type { scanRepository } from '../repository/scan.repository.js';

type DashboardRow = NonNullable<Awaited<ReturnType<typeof scanRepository.findDashboardPayload>>>;

export interface DashboardIngredientRow {
  ingredient_id: string | null;
  name: string;
  risk_level: string;
  reason: string;
}

/** Matches the API Specification's `GET /scans/{scanId}` response shape exactly. */
export function toDashboardDto(row: DashboardRow, ingredientRows: DashboardIngredientRow[], allergyWarning: string | null) {
  return {
    scan_id: row.scan.id,
    status: row.scan.status,
    scanned_at: row.scan.scannedAt,
    product: {
      id: row.product.id,
      name: row.product.name,
      brand_name: row.brand?.name ?? null,
    },
    safety_score: row.safetyScore
      ? {
          score: row.safetyScore.score,
          verdict: row.safetyScore.verdict,
          ingredient_count: row.safetyScore.ingredientCount,
          flagged_count: row.safetyScore.flaggedCount,
        }
      : null,
    ai_summary: row.aiSummary
      ? {
          summary_text: row.aiSummary.summaryText,
          allergy_warning: row.aiSummary.allergyWarning ?? allergyWarning,
        }
      : null,
    ingredients: ingredientRows,
  };
}
