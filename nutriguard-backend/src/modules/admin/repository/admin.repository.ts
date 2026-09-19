import { count, avg, gte, and, ilike, desc, eq } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { scans, safetyScores, userProfiles } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';

export class AdminRepository {
  constructor(private readonly database: Database = db) {}

  /**
   * Computed live for this delivery (no `admin_dashboard_metrics_cache`
   * materialized-view refresh job yet — see Database Design Document
   * §18 for the caching strategy this should graduate to once traffic
   * volume makes a live aggregate query here too slow).
   */
  async getDashboardMetrics(fromDate?: Date) {
    try {
      const conditions = fromDate ? [gte(scans.scannedAt, fromDate)] : [];

      const [scanStats] = await this.database
        .select({
          totalScans: count(),
          avgSafetyScore: avg(safetyScores.score),
        })
        .from(scans)
        .leftJoin(safetyScores, eq(scans.id, safetyScores.scanId))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const [userStats] = await this.database.select({ totalUsers: count() }).from(userProfiles);

      return {
        total_scans: scanStats?.totalScans ?? 0,
        avg_safety_score: scanStats?.avgSafetyScore ? Number(scanStats.avgSafetyScore).toFixed(1) : null,
        total_users: userStats?.totalUsers ?? 0,
      };
    } catch (err) {
      throw new DatabaseError('Failed to compute dashboard metrics', undefined, err);
    }
  }

  async listUsers(query: string | undefined, page: number, limit: number) {
    try {
      const conditions = query ? ilike(userProfiles.fullName, `%${query}%`) : undefined;

      const [rows, totalResult] = await Promise.all([
        this.database
          .select()
          .from(userProfiles)
          .where(conditions)
          .orderBy(desc(userProfiles.createdAt))
          .limit(limit)
          .offset((page - 1) * limit),
        this.database.select({ value: count() }).from(userProfiles).where(conditions),
      ]);

      return { rows, total: totalResult[0]?.value ?? 0 };
    } catch (err) {
      throw new DatabaseError('Failed to list users', undefined, err);
    }
  }
}

export const adminRepository = new AdminRepository();
