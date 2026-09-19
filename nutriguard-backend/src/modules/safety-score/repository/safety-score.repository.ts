import { eq } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { safetyScores } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';
import type { NewSafetyScore } from '@database/schema/index.js';

export class SafetyScoreRepository {
  constructor(private readonly database: Database = db) {}

  async findByScanId(scanId: string) {
    try {
      const [row] = await this.database.select().from(safetyScores).where(eq(safetyScores.scanId, scanId)).limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch safety score', undefined, err);
    }
  }

  async create(input: NewSafetyScore): Promise<void> {
    try {
      await this.database.insert(safetyScores).values(input);
    } catch (err) {
      throw new DatabaseError('Failed to persist safety score', undefined, err);
    }
  }
}

export const safetyScoreRepository = new SafetyScoreRepository();
