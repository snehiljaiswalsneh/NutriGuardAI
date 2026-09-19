import type { Context } from 'hono';
import { allergenService } from '../service/allergen.service.js';
import { successResponse } from '@shared/utils/response.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export class AllergenController {
  async getForIngredient(c: Context<AppEnv>, ingredientId: string) {
    const allergens = await allergenService.getForIngredient(ingredientId);
    return c.json(successResponse(allergens), 200);
  }
}

export const allergenController = new AllergenController();
