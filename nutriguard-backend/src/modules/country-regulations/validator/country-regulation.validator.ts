import { z } from 'zod';

export const ingredientIdParamSchema = z.object({
  ingredientId: z.string().uuid('Must be a valid UUID'),
});

export const regulationQuerySchema = z.object({
  country_code: z
    .string()
    .length(2, 'country_code must be a 2-letter ISO code')
    .optional(),
});
export type RegulationQuery = z.infer<typeof regulationQuerySchema>;
