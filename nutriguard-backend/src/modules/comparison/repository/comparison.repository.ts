import { eq, desc, and } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { comparisons } from '@database/schema/index.js';
import { DatabaseError, NotFoundError, ForbiddenError } from '@shared/errors/app-error.js';
import type { NewComparison } from '@database/schema/index.js';

export class ComparisonRepository {
  constructor(private readonly database: Database = db) {}

  async create(input: NewComparison): Promise<string> {
    try {
      const [row] = await this.database.insert(comparisons).values(input).returning({ id: comparisons.id });
      if (!row) throw new DatabaseError('Comparison insert did not return an id');
      return row.id;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError('Failed to create comparison', undefined, err);
    }
  }

  async findByUser(userId: string, page: number, limit: number) {
    try {
      return await this.database
        .select()
        .from(comparisons)
        .where(eq(comparisons.userId, userId))
        .orderBy(desc(comparisons.comparedAt))
        .limit(limit)
        .offset((page - 1) * limit);
    } catch (err) {
      throw new DatabaseError('Failed to list comparisons', undefined, err);
    }
  }

  async findOwnedOrThrow(comparisonId: string, userId: string) {
    try {
      const [row] = await this.database
        .select()
        .from(comparisons)
        .where(and(eq(comparisons.id, comparisonId), eq(comparisons.userId, userId)))
        .limit(1);
      if (!row) throw new NotFoundError('Comparison', comparisonId);
      return row;
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
      throw new DatabaseError('Failed to fetch comparison', undefined, err);
    }
  }

  async deleteById(comparisonId: string, userId: string): Promise<void> {
    await this.findOwnedOrThrow(comparisonId, userId);
    try {
      await this.database.delete(comparisons).where(eq(comparisons.id, comparisonId));
    } catch (err) {
      throw new DatabaseError('Failed to delete comparison', undefined, err);
    }
  }
}

export const comparisonRepository = new ComparisonRepository();
