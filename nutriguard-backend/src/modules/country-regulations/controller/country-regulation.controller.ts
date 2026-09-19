import type { Context } from 'hono';
import { countryRegulationService } from '../service/country-regulation.service.js';
import { successResponse } from '@shared/utils/response.js';
import type { RegulationQuery } from '../validator/country-regulation.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';

export class CountryRegulationController {
  async listCountries(c: Context<AppEnv>) {
    const rows = await countryRegulationService.listCountries();
    return c.json(
      successResponse(
        rows.map((r) => ({ id: r.id, iso_code: r.isoCode, name: r.name, flag_emoji: r.flagEmoji, region: r.region }))
      ),
      200
    );
  }

  async getIngredientRegulations(c: Context<AppEnv>, ingredientId: string, query: RegulationQuery) {
    const regulations = await countryRegulationService.getRegulationsForIngredient(ingredientId, query.country_code);
    return c.json(successResponse(regulations), 200);
  }
}

export const countryRegulationController = new CountryRegulationController();
