import { z } from 'zod';

export const triggerAnalysisSchema = z.object({
  product_name: z.string().trim().max(300).optional(),
  brand_name: z.string().trim().max(200).optional(),
  ingredient_text: z
    .string()
    .trim()
    .min(1, 'ingredient_text is required')
    .max(5000, 'ingredient_text must be 5000 characters or fewer')
    .refine((text) => /[,\n]/.test(text) || text.split(/\s+/).length <= 3, {
      message: 'ingredient_text does not look like a comma/newline-separated ingredient list',
    }),
  input_source: z.enum(['paste', 'manual', 'ocr', 'barcode', 'voice']),
});
export type TriggerAnalysisRequest = z.infer<typeof triggerAnalysisSchema>;

export const scanIdParamSchema = z.object({
  scanId: z.string().uuid('Must be a valid UUID'),
});
