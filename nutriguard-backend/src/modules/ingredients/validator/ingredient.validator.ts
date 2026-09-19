import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '@shared/constants/index.js';

const riskLevelEnum = z.enum(['safe', 'moderate', 'high', 'unknown']);
const uuidSchema = z.string().uuid('Must be a valid UUID');

/** Coerces query-string values ("1", "20") into numbers with sane bounds. */
const pageParam = z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.DEFAULT_PAGE);
const limitParam = z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.MAX_LIMIT).default(PAGINATION_DEFAULTS.DEFAULT_LIMIT);

export const ingredientSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  risk_level: riskLevelEnum.optional(),
  category_id: uuidSchema.optional(),
  page: pageParam,
  limit: limitParam,
  sort: z.string().max(50).optional(),
});
export type IngredientSearchQuery = z.infer<typeof ingredientSearchQuerySchema>;

export const ingredientIdParamSchema = z.object({
  ingredientId: uuidSchema,
});

const nameSchema = z.string().trim().min(1, 'Name is required').max(200);

export const createIngredientSchema = z.object({
  name: nameSchema,
  scientific_name: z.string().max(200).optional(),
  e_number: z.string().max(20).optional(),
  category_id: uuidSchema.optional(),
  risk_level: riskLevelEnum,
  risk_summary: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  purpose: z.string().max(500).optional(),
  is_natural: z.boolean().optional(),
  is_synthetic: z.boolean().optional(),
});
export type CreateIngredientRequest = z.infer<typeof createIngredientSchema>;

export const updateIngredientSchema = createIngredientSchema.partial();
export type UpdateIngredientRequest = z.infer<typeof updateIngredientSchema>;
