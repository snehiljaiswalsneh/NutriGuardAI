import { eq, and, desc, lt, gte, lte, ilike, count } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { scans, products, brands, safetyScores } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';
import type { RiskLevel } from '@shared/constants/index.js';

export interface HistoryFilters {
  userId: string;
  riskLevel?: RiskLevel;
  fromDate?: Date;
  toDate?: Date;
  q?: string;
  cursor?: Date;
  limit: number;
}

/**
 * Separate from `ScanRepository` (Analysis module) deliberately — this
 * repository owns the *listing* query pattern (keyset pagination,
 * filters, search) which is a distinct concern from the Analysis
 * module's single-scan read/write lifecycle, per Backend Folder
 * Structure §3's module-boundary guidance ("Dependencies" — History
 * depends on the `scans` table but not on Analysis module internals).
 */
export class HistoryRepository {
  constructor(private readonly database: Database = db) {}

  /** Cursor-based (keyset) pagination on `scanned_at` — see API Specification §19. */
  async list(filters: HistoryFilters) {
    try {
      const conditions = [eq(scans.userId, filters.userId), eq(scans.status, 'completed')];

      if (filters.riskLevel) conditions.push(eq(safetyScores.verdict, filters.riskLevel));
      if (filters.fromDate) conditions.push(gte(scans.scannedAt, filters.fromDate));
      if (filters.toDate) conditions.push(lte(scans.scannedAt, filters.toDate));
      if (filters.q) conditions.push(ilike(products.name, `%${filters.q}%`));
      if (filters.cursor) conditions.push(lt(scans.scannedAt, filters.cursor));

      const rows = await this.database
        .select({ scan: scans, product: products, brand: brands, safetyScore: safetyScores })
        .from(scans)
        .innerJoin(products, eq(scans.productId, products.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(safetyScores, eq(scans.id, safetyScores.scanId))
        .where(and(...conditions))
        .orderBy(desc(scans.scannedAt))
        .limit(filters.limit + 1); // fetch one extra row to know if a next page exists

      const hasMore = rows.length > filters.limit;
      const page = hasMore ? rows.slice(0, filters.limit) : rows;
      const nextCursor = hasMore ? page[page.length - 1]?.scan.scannedAt.toISOString() ?? null : null;

      return { rows: page, nextCursor };
    } catch (err) {
      throw new DatabaseError('Failed to list scan history', undefined, err);
    }
  }

  async countForUser(userId: string): Promise<number> {
    try {
      const [row] = await this.database
        .select({ value: count() })
        .from(scans)
        .where(and(eq(scans.userId, userId), eq(scans.status, 'completed')));
      return row?.value ?? 0;
    } catch (err) {
      throw new DatabaseError('Failed to count scan history', undefined, err);
    }
  }

  /** All completed scans for a user, for export — no pagination limit (bounded by a hard cap to protect memory). */
  async findAllForExport(userId: string, hardCap = 5000) {
    try {
      return await this.database
        .select({ scan: scans, product: products, brand: brands, safetyScore: safetyScores })
        .from(scans)
        .innerJoin(products, eq(scans.productId, products.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(safetyScores, eq(scans.id, safetyScores.scanId))
        .where(and(eq(scans.userId, userId), eq(scans.status, 'completed')))
        .orderBy(desc(scans.scannedAt))
        .limit(hardCap);
    } catch (err) {
      throw new DatabaseError('Failed to fetch scan history for export', undefined, err);
    }
  }
}

export const historyRepository = new HistoryRepository();
