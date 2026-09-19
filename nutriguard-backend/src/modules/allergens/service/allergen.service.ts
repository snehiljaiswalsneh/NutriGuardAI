import { allergenRepository, AllergenRepository } from '../repository/allergen.repository.js';

export interface AllergenView {
  allergen_id: string;
  name: string;
  severity: string;
  note: string | null;
}

export interface ScanAllergenSummary {
  detected_allergens: { name: string; severity: string; ingredient_names: string[] }[];
  warning_text: string | null;
}

/**
 * Implements AI Agent LLD §13 Allergy Detection: exact-match lookup
 * against the `ingredient_allergens` junction (never inferred by the LLM
 * — allergen safety claims are exactly the kind of fact that must come
 * from structured data, per the project's "database before generation"
 * principle) plus deterministic warning-text assembly.
 */
export class AllergenService {
  constructor(private readonly repository: AllergenRepository = allergenRepository) {}

  async getForIngredient(ingredientId: string): Promise<AllergenView[]> {
    const rows = await this.repository.findByIngredientId(ingredientId);
    return rows.map((r) => ({
      allergen_id: r.allergen.id,
      name: r.allergen.name,
      severity: r.link.severity,
      note: r.link.note,
    }));
  }

  /**
   * Detects every allergen across a scan's full ingredient list and
   * assembles the single `allergy_warning` string shown on the
   * Dashboard — called by the Analysis module (Phase 11), not directly
   * by a route, since it needs the full matched-ingredient set of a scan.
   */
  async detectForScan(
    matchedIngredients: { ingredientId: string; name: string }[]
  ): Promise<ScanAllergenSummary> {
    const ids = matchedIngredients.map((i) => i.ingredientId);
    const rows = await this.repository.findByIngredientIds(ids);

    if (rows.length === 0) {
      return { detected_allergens: [], warning_text: null };
    }

    const byAllergen = new Map<string, { name: string; severity: string; ingredientIds: Set<string> }>();
    for (const row of rows) {
      const existing = byAllergen.get(row.allergen.id);
      if (existing) {
        existing.ingredientIds.add(row.link.ingredientId);
        // Escalate to the most severe classification seen across ingredients
        if (this.severityRank(row.link.severity) > this.severityRank(existing.severity)) {
          existing.severity = row.link.severity;
        }
      } else {
        byAllergen.set(row.allergen.id, {
          name: row.allergen.name,
          severity: row.link.severity,
          ingredientIds: new Set([row.link.ingredientId]),
        });
      }
    }

    const nameById = new Map(matchedIngredients.map((i) => [i.ingredientId, i.name]));
    const detected = Array.from(byAllergen.values()).map((a) => ({
      name: a.name,
      severity: a.severity,
      ingredient_names: Array.from(a.ingredientIds).map((id) => nameById.get(id) ?? 'Unknown ingredient'),
    }));

    const warningText =
      detected.length > 0
        ? `Contains ${detected.map((d) => d.name.toLowerCase()).join(' and ')}.`
        : null;

    return { detected_allergens: detected, warning_text: warningText };
  }

  private severityRank(severity: string): number {
    return { mild: 1, moderate: 2, severe: 3 }[severity] ?? 0;
  }
}

export const allergenService = new AllergenService();
