import type { IngredientSummary, IngredientDetail, IngredientCategoryView } from '../types/ingredient.types.js';

export interface IngredientSummaryDto {
  id: string;
  name: string;
  scientific_name: string | null;
  e_number: string | null;
  risk_level: string;
  risk_summary: string | null;
  description: string | null;
  purpose: string | null;
}

export function toIngredientSummaryDto(i: IngredientSummary): IngredientSummaryDto {
  return {
    id: i.id,
    name: i.name,
    scientific_name: i.scientificName,
    e_number: i.eNumber,
    risk_level: i.riskLevel,
    risk_summary: i.riskSummary,
    description: i.description,
    purpose: i.purpose,
  };
}

export interface IngredientDetailDto extends IngredientSummaryDto {
  category_id: string | null;
  category_name: string | null;
  is_natural: boolean;
  is_synthetic: boolean;
  health_effects: { id: string; effect: string; severity: string; display_order: number }[];
  sources: { id: string; label: string; url: string; publisher: string | null }[];
}

export function toIngredientDetailDto(i: IngredientDetail): IngredientDetailDto {
  return {
    ...toIngredientSummaryDto(i),
    category_id: i.categoryId,
    category_name: i.categoryName,
    is_natural: i.isNatural,
    is_synthetic: i.isSynthetic,
    health_effects: i.healthEffects.map((h) => ({
      id: h.id,
      effect: h.effect,
      severity: h.severity,
      display_order: h.displayOrder,
    })),
    sources: i.sources.map((s) => ({ id: s.id, label: s.label, url: s.url, publisher: s.publisher })),
  };
}

export interface IngredientCategoryDto {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
}

export function toIngredientCategoryDto(c: IngredientCategoryView): IngredientCategoryDto {
  return { id: c.id, parent_id: c.parentId, name: c.name, slug: c.slug, description: c.description };
}
