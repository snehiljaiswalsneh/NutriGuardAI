import { historyRepository, HistoryRepository } from '../repository/history.repository.js';
import { logger } from '@shared/logger/logger.js';
import type { HistoryListQuery } from '../validator/history.validator.js';

export interface HistoryListItem {
  scan_id: string;
  product_name: string;
  brand_name: string | null;
  safety_score: number | null;
  verdict: string | null;
  scanned_at: string;
}

export class HistoryService {
  constructor(private readonly repository: HistoryRepository = historyRepository) {}

  async list(userId: string, query: HistoryListQuery): Promise<{ items: HistoryListItem[]; totalItems: number; nextCursor: string | null }> {
    const { rows, nextCursor } = await this.repository.list({
      userId,
      riskLevel: query.risk_level,
      fromDate: query.from_date,
      toDate: query.to_date,
      q: query.q,
      cursor: query.cursor ? new Date(query.cursor) : undefined,
      limit: query.limit,
    });

    const totalItems = await this.repository.countForUser(userId);

    return {
      items: rows.map((r) => ({
        scan_id: r.scan.id,
        product_name: r.product.name,
        brand_name: r.brand?.name ?? null,
        safety_score: r.safetyScore?.score ?? null,
        verdict: r.safetyScore?.verdict ?? null,
        scanned_at: r.scan.scannedAt.toISOString(),
      })),
      totalItems,
      nextCursor,
    };
  }

  /**
   * Per API Specification §8, export is modeled as an async job (`202`)
   * even though this implementation generates it inline — kept
   * synchronous here (no queue infra yet, same simplification noted in
   * the Analysis module) but capped at a hard row limit so a pathological
   * request can't exhaust memory. Returns a ready-to-download payload
   * directly rather than an email link, since there's no email-sending
   * infra in this delivery either — see README "Next Steps".
   */
  async export(userId: string, format: 'csv' | 'json' | 'pdf'): Promise<{ contentType: string; filename: string; body: string }> {
    if (format === 'pdf') {
      // PDF generation requires a rendering dependency not in this
      // delivery's scope — fails loudly rather than silently degrading.
      throw new Error('PDF export is not yet implemented; use format=csv or format=json');
    }

    const rows = await this.repository.findAllForExport(userId);
    logger.info({ userId, rowCount: rows.length, format }, 'scan history export generated');

    if (format === 'json') {
      const body = JSON.stringify(
        rows.map((r) => ({
          scan_id: r.scan.id,
          product_name: r.product.name,
          brand_name: r.brand?.name ?? null,
          safety_score: r.safetyScore?.score ?? null,
          verdict: r.safetyScore?.verdict ?? null,
          scanned_at: r.scan.scannedAt.toISOString(),
        })),
        null,
        2
      );
      return { contentType: 'application/json', filename: 'scan-history.json', body };
    }

    const header = 'scan_id,product_name,brand_name,safety_score,verdict,scanned_at';
    const csvRows = rows.map((r) =>
      [
        r.scan.id,
        this.csvEscape(r.product.name),
        this.csvEscape(r.brand?.name ?? ''),
        r.safetyScore?.score ?? '',
        r.safetyScore?.verdict ?? '',
        r.scan.scannedAt.toISOString(),
      ].join(',')
    );
    return { contentType: 'text/csv', filename: 'scan-history.csv', body: [header, ...csvRows].join('\n') };
  }

  private csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}

export const historyService = new HistoryService();
