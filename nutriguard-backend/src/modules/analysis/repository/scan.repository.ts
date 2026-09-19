import { eq } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { scans, safetyScores, aiSummaries, products, brands } from '@database/schema/index.js';
import { DatabaseError, NotFoundError, ForbiddenError } from '@shared/errors/app-error.js';
import type { NewScan, NewAiSummary } from '@database/schema/index.js';

export class ScanRepository {
  constructor(private readonly database: Database = db) {}

  async create(input: NewScan): Promise<string> {
    try {
      const [row] = await this.database.insert(scans).values(input).returning({ id: scans.id });
      if (!row) throw new DatabaseError('Scan insert did not return an id');
      return row.id;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError('Failed to create scan', undefined, err);
    }
  }

  async updateStatus(scanId: string, status: 'processing' | 'completed' | 'failed', errorMessage?: string): Promise<void> {
    try {
      await this.database.update(scans).set({ status, errorMessage }).where(eq(scans.id, scanId));
    } catch (err) {
      throw new DatabaseError('Failed to update scan status', undefined, err);
    }
  }

  async saveAiSummary(input: NewAiSummary): Promise<void> {
    try {
      await this.database.insert(aiSummaries).values(input);
    } catch (err) {
      throw new DatabaseError('Failed to save AI summary', undefined, err);
    }
  }

  /** The full "Dashboard payload" join — mirrors `scan_dashboard_view` from the Database Design Document. */
  async findDashboardPayload(scanId: string) {
    try {
      const [row] = await this.database
        .select({
          scan: scans,
          product: products,
          brand: brands,
          safetyScore: safetyScores,
          aiSummary: aiSummaries,
        })
        .from(scans)
        .innerJoin(products, eq(scans.productId, products.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(safetyScores, eq(scans.id, safetyScores.scanId))
        .leftJoin(aiSummaries, eq(scans.id, aiSummaries.scanId))
        .where(eq(scans.id, scanId))
        .limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch scan dashboard payload', undefined, err);
    }
  }

  /** Enforces RLS-equivalent ownership at the application layer (defense-in-depth alongside Postgres RLS). */
  async findOwnedOrThrow(scanId: string, userId: string) {
    const payload = await this.findDashboardPayload(scanId);
    if (!payload) throw new NotFoundError('Scan', scanId);
    if (payload.scan.userId !== userId) throw new ForbiddenError('You do not have access to this scan');
    return payload;
  }

  async deleteById(scanId: string, userId: string): Promise<void> {
    try {
      const payload = await this.findDashboardPayload(scanId);
      if (!payload) throw new NotFoundError('Scan', scanId);
      if (payload.scan.userId !== userId) throw new ForbiddenError('You do not have access to this scan');
      await this.database.delete(scans).where(eq(scans.id, scanId));
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
      throw new DatabaseError('Failed to delete scan', undefined, err);
    }
  }
}

export const scanRepository = new ScanRepository();
