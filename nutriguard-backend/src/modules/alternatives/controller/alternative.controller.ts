import type { Context } from 'hono';
import { alternativeService } from '../service/alternative.service.js';
import { successResponse } from '@shared/utils/response.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export class AlternativeController {
  async getForIngredient(c: Context<AppEnv>, ingredientId: string) {
    const alternatives = await alternativeService.getAlternatives(ingredientId);
    return c.json(successResponse(alternatives), 200);
  }
}

export const alternativeController = new AlternativeController();
