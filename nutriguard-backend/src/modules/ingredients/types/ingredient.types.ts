import type { RiskLevel } from '@shared/constants/index.js';

export interface IngredientSearchParams {
  q?: string;
  riskLevel?: RiskLevel;
  categoryId?: string;
  page: number;
  limit: number;
  sort?: string;
}

export interface IngredientSummary {
  id: string;
  name: string;
  scientificName: string | null;
  eNumber: string | null;
  riskLevel: RiskLevel;
  riskSummary: string | null;
  description: string | null;
  purpose: string | null;
}

export interface IngredientHealthEffectView {
  id: string;
  effect: string;
  severity: RiskLevel;
  displayOrder: number;
}

export interface ResearchSourceView {
  id: string;
  label: string;
  url: string;
  publisher: string | null;
}

export interface IngredientDetail extends IngredientSummary {
  categoryId: string | null;
  categoryName: string | null;
  isNatural: boolean;
  isSynthetic: boolean;
  healthEffects: IngredientHealthEffectView[];
  sources: ResearchSourceView[];
}

export interface IngredientCategoryView {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
}

export interface CreateIngredientInput {
  name: string;
  scientificName?: string;
  eNumber?: string;
  categoryId?: string;
  riskLevel: RiskLevel;
  riskSummary?: string;
  description?: string;
  purpose?: string;
  isNatural?: boolean;
  isSynthetic?: boolean;
}

export type UpdateIngredientInput = Partial<CreateIngredientInput>;
