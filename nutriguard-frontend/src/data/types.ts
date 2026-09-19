// ─────────────────────────────────────────────────────────────
// UI TYPES — used directly by pages, components, mock data
// ─────────────────────────────────────────────────────────────

export interface NutritionFact {
  name: string
  amount: string
  unit: string
  dailyValue?: number   // % of daily recommended intake (0–100+)
  goodFor?: string[]    // e.g. ['Muscle Gain', 'Fat Loss'] — maps to fitnessGoal options
  badFor?: string[]     // e.g. ['Diabetes', 'High Blood Pressure']
  benefitLabel?: string // e.g. 'Supports muscle repair'
}

export interface NutritionProfile {
  calories?: number
  servingSize?: string
  macros?: NutritionFact[]
  vitamins?: NutritionFact[]
  minerals?: NutritionFact[]
  otherNutrients?: NutritionFact[]
}

export type RiskLevel = 'safe' | 'moderate' | 'high' | 'unknown'

export interface CountryStatus {
  country: string
  flag: string
  status: 'Approved' | 'Restricted' | 'Banned'
  explanation?: string
  source?: string
  lastUpdated?: string
}

export interface Alternative {
  id: string
  name: string
  scoreDelta?: number
  reason: string
  riskLevel?: RiskLevel
  similarity?: number
}

export interface Ingredient {
  id: string
  name: string
  scientificName?: string | null
  risk: RiskLevel
  reason: string
  purpose?: string | null
  description?: string | null
  healthEffects?: string[]
  countries?: CountryStatus[]
  alternatives?: Alternative[]
  sources?: { label: string; url: string }[]
}

export interface Analysis {
  id: string
  productName: string
  brand: string
  scanDate: string
  safetyScore: number
  verdict: string
  aiSummary: string
  allergyWarning?: string | null
  ingredients: Ingredient[]
  nutritionProfile?: NutritionProfile
}

// ─────────────────────────────────────────────────────────────
// API DTO TYPES — match the exact backend response shapes
// ─────────────────────────────────────────────────────────────

export interface DashboardIngredientDTO {
  ingredient_id: string | null
  name: string
  risk_level: RiskLevel
  reason: string
  scientific_name?: string | null
  purpose?: string | null
  description?: string | null
  health_effects?: string[]
  countries?: CountryStatus[]
  alternatives?: {
    id: string
    name: string
    score_delta?: number
    reason: string
    risk_level?: RiskLevel
    similarity?: number
  }[]
  sources?: { label: string; url: string }[]
}

export interface AnalysisDTO {
  scan_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scanned_at: string
  product: {
    id: string
    name: string
    brand_name: string | null
  }
  safety_score: {
    score: number
    verdict: string
    ingredient_count: number
    flagged_count: number
  } | null
  ai_summary: {
    summary_text: string
    allergy_warning: string | null
  } | null
  ingredients: DashboardIngredientDTO[]
}

export interface ComparisonDifference {
  dimension: 'safety_score' | 'ingredient_count' | 'flagged_ingredient_count' | 'allergen_overlap'
  product_a_value: string | number
  product_b_value: string | number
  significance: 'minor' | 'moderate' | 'major'
}

export interface ComparisonResultType {
  comparison_id: string
  winner: 'product_a' | 'product_b' | 'tie'
  recommendation_text: string
  differences: ComparisonDifference[]
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  themePreference: 'light' | 'dark' | 'system'
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// MAPPERS — convert API DTOs → UI types
// ─────────────────────────────────────────────────────────────

/** Convert a backend DashboardIngredientDTO into the UI Ingredient shape */
export function mapDTOToIngredient(dto: DashboardIngredientDTO): Ingredient {
  return {
    id: dto.ingredient_id || dto.name.toLowerCase().replace(/\s+/g, '-'),
    name: dto.name,
    scientificName: dto.scientific_name ?? null,
    risk: dto.risk_level,
    reason: dto.reason,
    purpose: dto.purpose ?? null,
    description: dto.description ?? null,
    healthEffects: dto.health_effects ?? [],
    countries: dto.countries ?? [],
    alternatives: (dto.alternatives ?? []).map((alt) => ({
      id: alt.id,
      name: alt.name,
      scoreDelta: alt.score_delta,
      reason: alt.reason,
      riskLevel: alt.risk_level,
      similarity: alt.similarity,
    })),
    sources: dto.sources ?? [],
  }
}

/** Convert a backend AnalysisDTO into the UI Analysis shape */
export function mapDTOToAnalysis(dto: AnalysisDTO): Analysis {
  return {
    id: dto.scan_id,
    productName: dto.product.name,
    brand: dto.product.brand_name || 'Unknown Brand',
    scanDate: new Date(dto.scanned_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    safetyScore: dto.safety_score?.score ?? 0,
    verdict: dto.safety_score?.verdict ?? 'Pending',
    aiSummary: dto.ai_summary?.summary_text ?? 'Analysis in progress…',
    allergyWarning: dto.ai_summary?.allergy_warning ?? null,
    ingredients: dto.ingredients.map(mapDTOToIngredient),
  }
}
