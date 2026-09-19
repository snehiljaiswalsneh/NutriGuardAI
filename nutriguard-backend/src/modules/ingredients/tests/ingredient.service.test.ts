import { describe, it, expect, vi } from 'vitest';
import { IngredientService } from '../service/ingredient.service.js';
import { IngredientRepository } from '../repository/ingredient.repository.js';
import { DatabaseError, NotFoundError, ConflictError } from '@shared/errors/app-error.js';

function createMockRepository(): IngredientRepository {
  return {
    search: vi.fn(),
    findById: vi.fn(),
    findHealthEffects: vi.fn(),
    findResearchSources: vi.fn(),
    findCategories: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  } as unknown as IngredientRepository;
}

const sampleIngredientRow = {
  id: 'ing-1',
  name: 'Sodium Nitrite',
  scientificName: 'NaNO2',
  eNumber: 'E250',
  riskLevel: 'high',
  riskSummary: 'Linked to nitrosamine formation',
  description: 'A curing agent.',
  purpose: 'Preservative',
  categoryId: 'cat-1',
  isNatural: false,
  isSynthetic: true,
};

describe('IngredientService', () => {
  describe('search', () => {
    it('maps repository rows to IngredientSummary and passes through total', async () => {
      const repo = createMockRepository();
      repo.search = vi.fn().mockResolvedValue({ rows: [sampleIngredientRow], total: 1 });
      const service = new IngredientService(repo);

      const result = await service.search({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({ id: 'ing-1', name: 'Sodium Nitrite', riskLevel: 'high' });
    });
  });

  describe('getById', () => {
    it('throws NotFoundError when the ingredient does not exist', async () => {
      const repo = createMockRepository();
      repo.findById = vi.fn().mockResolvedValue(null);
      const service = new IngredientService(repo);

      await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('assembles health effects and sources into the full detail view', async () => {
      const repo = createMockRepository();
      repo.findById = vi.fn().mockResolvedValue({ ingredient: sampleIngredientRow, categoryName: 'Preservatives' });
      repo.findHealthEffects = vi
        .fn()
        .mockResolvedValue([{ id: 'he-1', effect: 'Nitrosamine formation', severity: 'high', displayOrder: 1 }]);
      repo.findResearchSources = vi
        .fn()
        .mockResolvedValue([{ source: { id: 'src-1', label: 'WHO Report', url: 'https://who.int', publisher: 'WHO' } }]);
      const service = new IngredientService(repo);

      const detail = await service.getById('ing-1');

      expect(detail.categoryName).toBe('Preservatives');
      expect(detail.healthEffects).toHaveLength(1);
      expect(detail.sources).toHaveLength(1);
      expect(detail.sources[0]).toMatchObject({ label: 'WHO Report' });
    });
  });

  describe('create', () => {
    it('translates a unique_violation DatabaseError into ConflictError', async () => {
      const repo = createMockRepository();
      const uniqueViolation = new DatabaseError('insert failed', undefined, { code: '23505' });
      repo.create = vi.fn().mockRejectedValue(uniqueViolation);
      const service = new IngredientService(repo);

      await expect(
        service.create({ name: 'Citric Acid', riskLevel: 'safe' })
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('re-throws non-conflict database errors unchanged', async () => {
      const repo = createMockRepository();
      const genericError = new DatabaseError('connection lost', undefined, { code: '08006' });
      repo.create = vi.fn().mockRejectedValue(genericError);
      const service = new IngredientService(repo);

      await expect(service.create({ name: 'X', riskLevel: 'safe' })).rejects.toBe(genericError);
    });
  });

  describe('update / softDelete', () => {
    it('throws NotFoundError before attempting to update a non-existent ingredient', async () => {
      const repo = createMockRepository();
      repo.findById = vi.fn().mockResolvedValue(null);
      const service = new IngredientService(repo);

      await expect(service.update('missing', { name: 'New Name' })).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('calls repository.softDelete when the ingredient exists', async () => {
      const repo = createMockRepository();
      repo.findById = vi.fn().mockResolvedValue({ ingredient: sampleIngredientRow, categoryName: null });
      const service = new IngredientService(repo);

      await service.softDelete('ing-1');

      expect(repo.softDelete).toHaveBeenCalledWith('ing-1');
    });
  });
});
