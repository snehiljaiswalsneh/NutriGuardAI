import { countryRegulationRepository, CountryRegulationRepository } from '../repository/country-regulation.repository.js';
import { NotFoundError } from '@shared/errors/app-error.js';

export interface RegulationView {
  country: { iso_code: string; name: string; flag_emoji: string | null };
  status: string;
  regulation_note: string | null;
}

export class CountryRegulationService {
  constructor(private readonly repository: CountryRegulationRepository = countryRegulationRepository) {}

  async listCountries() {
    return this.repository.listCountries();
  }

  /**
   * Returns the per-country regulatory status list for one ingredient —
   * this is the exact data shape the Risk Analysis Agent (AI Agent LLD §8
   * "Knowledge Retrieval Pipeline") consumes as grounding context, and
   * what `GET /ingredients/{id}/regulations` returns to the frontend.
   * Optionally filtered to a single country when `countryCode` is given.
   */
  async getRegulationsForIngredient(ingredientId: string, countryCode?: string): Promise<RegulationView[]> {
    const rows = await this.repository.findRegulationsForIngredient(ingredientId);

    const filtered = countryCode ? rows.filter((r) => r.country.isoCode === countryCode.toUpperCase()) : rows;

    return filtered.map((r) => ({
      country: { iso_code: r.country.isoCode, name: r.country.name, flag_emoji: r.country.flagEmoji },
      status: r.regulation.status,
      regulation_note: r.regulation.regulationNote,
    }));
  }

  async getCountryOrThrow(isoCode: string) {
    const country = await this.repository.findByIsoCode(isoCode.toUpperCase());
    if (!country) throw new NotFoundError('Country', isoCode);
    return country;
  }
}

export const countryRegulationService = new CountryRegulationService();
