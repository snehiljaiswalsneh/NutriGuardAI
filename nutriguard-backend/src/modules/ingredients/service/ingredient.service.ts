import { IngredientRepository, ingredientRepository } from '../repository/ingredient.repository.js';
import { NotFoundError, ConflictError, DatabaseError } from '@shared/errors/app-error.js';
import type {
  IngredientSearchParams,
  IngredientSummary,
  IngredientDetail,
  IngredientCategoryView,
  CreateIngredientInput,
  UpdateIngredientInput,
} from '../types/ingredient.types.js';
import type { RiskLevel } from '@shared/constants/index.js';

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export class IngredientService {
  constructor(private readonly repository: IngredientRepository = ingredientRepository) {}

  async search(params: IngredientSearchParams): Promise<PagedResult<IngredientSummary>> {
    const { rows, total } = await this.repository.search(params);
    return {
      items: rows.map((r) => this.toSummary(r)),
      total,
    };
  }

  async getById(ingredientId: string): Promise<IngredientDetail> {
    const row = await this.repository.findById(ingredientId);
    if (!row) {
      throw new NotFoundError('Ingredient', ingredientId);
    }

    const [healthEffects, sourceRows] = await Promise.all([
      this.repository.findHealthEffects(ingredientId),
      this.repository.findResearchSources(ingredientId),
    ]);

    return {
      ...this.toSummary(row.ingredient),
      categoryId: row.ingredient.categoryId,
      categoryName: row.categoryName,
      isNatural: row.ingredient.isNatural,
      isSynthetic: row.ingredient.isSynthetic,
      healthEffects: healthEffects.map((h) => ({
        id: h.id,
        effect: h.effect,
        severity: h.severity as RiskLevel,
        displayOrder: h.displayOrder,
      })),
      sources: sourceRows.map((s) => ({
        id: s.source.id,
        label: s.source.label,
        url: s.source.url,
        publisher: s.source.publisher,
      })),
    };
  }

  async getHealthEffects(ingredientId: string) {
    // Confirms the ingredient exists first so a typo'd UUID returns a
    // clean 404 rather than a silently empty array.
    const row = await this.repository.findById(ingredientId);
    if (!row) {
      throw new NotFoundError('Ingredient', ingredientId);
    }
    const effects = await this.repository.findHealthEffects(ingredientId);
    return effects.map((h) => ({ id: h.id, effect: h.effect, severity: h.severity as RiskLevel, displayOrder: h.displayOrder }));
  }

  async listCategories(): Promise<IngredientCategoryView[]> {
    const rows = await this.repository.findCategories();
    return rows.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));
  }

  async create(input: CreateIngredientInput): Promise<string> {
    try {
      return await this.repository.create(input);
    } catch (err) {
      // Postgres unique_violation on ingredients.name surfaces here as a
      // generic DatabaseError from the repository — translate the
      // specific case into a proper 409 for the client.
      if (err instanceof DatabaseError && this.isUniqueViolation(err)) {
        throw new ConflictError(`An ingredient named '${input.name}' already exists`, 'name');
      }
      throw err;
    }
  }

  async update(ingredientId: string, input: UpdateIngredientInput): Promise<void> {
    const existing = await this.repository.findById(ingredientId);
    if (!existing) {
      throw new NotFoundError('Ingredient', ingredientId);
    }
    await this.repository.update(ingredientId, input);
  }

  async softDelete(ingredientId: string): Promise<void> {
    const existing = await this.repository.findById(ingredientId);
    if (!existing) {
      throw new NotFoundError('Ingredient', ingredientId);
    }
    await this.repository.softDelete(ingredientId);
  }

  private isUniqueViolation(err: DatabaseError): boolean {
    const cause = err.cause as { code?: string } | undefined;
    return cause?.code === '23505';
  }

  private toSummary(row: {
    id: string;
    name: string;
    scientificName: string | null;
    eNumber: string | null;
    riskLevel: string;
    riskSummary: string | null;
    description: string | null;
    purpose: string | null;
  }): IngredientSummary {
    return {
      id: row.id,
      name: row.name,
      scientificName: row.scientificName,
      eNumber: row.eNumber,
      riskLevel: row.riskLevel as RiskLevel,
      riskSummary: row.riskSummary,
      description: row.description,
      purpose: row.purpose,
    };
  }
}

export const ingredientService = new IngredientService();
