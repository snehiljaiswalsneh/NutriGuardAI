import type { Context } from 'hono';
import { ingredientService } from '../service/ingredient.service.js';
import {
  toIngredientSummaryDto,
  toIngredientDetailDto,
  toIngredientCategoryDto,
} from '../dto/ingredient.dto.js';
import { successResponse, buildPaginationMeta } from '@shared/utils/response.js';
import type { IngredientSearchQuery, CreateIngredientRequest, UpdateIngredientRequest } from '../validator/ingredient.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export class IngredientController {
  async search(c: Context<AppEnv>, query: IngredientSearchQuery) {
    const result = await ingredientService.search({
      q: query.q,
      riskLevel: query.risk_level,
      categoryId: query.category_id,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

    return c.json(
      successResponse(
        result.items.map(toIngredientSummaryDto),
        '',
        buildPaginationMeta(query.page, query.limit, result.total)
      ),
      200
    );
  }

  async getById(c: Context<AppEnv>, ingredientId: string) {
    const detail = await ingredientService.getById(ingredientId);
    return c.json(successResponse(toIngredientDetailDto(detail)), 200);
  }

  async getHealthEffects(c: Context<AppEnv>, ingredientId: string) {
    const effects = await ingredientService.getHealthEffects(ingredientId);
    return c.json(
      successResponse(
        effects.map((e) => ({ id: e.id, effect: e.effect, severity: e.severity, display_order: e.displayOrder }))
      ),
      200
    );
  }

  async listCategories(c: Context<AppEnv>) {
    const categories = await ingredientService.listCategories();
    return c.json(successResponse(categories.map(toIngredientCategoryDto)), 200);
  }

  async create(c: Context<AppEnv>, input: CreateIngredientRequest) {
    const id = await ingredientService.create({
      name: input.name,
      scientificName: input.scientific_name,
      eNumber: input.e_number,
      categoryId: input.category_id,
      riskLevel: input.risk_level,
      riskSummary: input.risk_summary,
      description: input.description,
      purpose: input.purpose,
      isNatural: input.is_natural,
      isSynthetic: input.is_synthetic,
    });
    const detail = await ingredientService.getById(id);
    return c.json(successResponse(toIngredientDetailDto(detail), 'Ingredient created'), 201);
  }

  async update(c: Context<AppEnv>, ingredientId: string, input: UpdateIngredientRequest) {
    await ingredientService.update(ingredientId, {
      name: input.name,
      scientificName: input.scientific_name,
      eNumber: input.e_number,
      categoryId: input.category_id,
      riskLevel: input.risk_level,
      riskSummary: input.risk_summary,
      description: input.description,
      purpose: input.purpose,
      isNatural: input.is_natural,
      isSynthetic: input.is_synthetic,
    });
    const detail = await ingredientService.getById(ingredientId);
    return c.json(successResponse(toIngredientDetailDto(detail), 'Ingredient updated'), 200);
  }

  async delete(c: Context<AppEnv>, ingredientId: string) {
    await ingredientService.softDelete(ingredientId);
    return c.body(null, 204);
  }
}

export const ingredientController = new IngredientController();
