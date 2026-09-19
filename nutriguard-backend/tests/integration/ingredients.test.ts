import { describe, it, expect, vi } from 'vitest';

/**
 * Mocks Drizzle's `db` object at the exact boundary the repository calls
 * it, so these tests exercise the real route → controller → service →
 * repository wiring and middleware stack, without a live database.
 */
vi.mock('@database/client.js', () => {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    // offset must come before limit in the Drizzle chain; both return the
    // chain so the other can be called afterwards.
    offset: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return {
    db: { ...chain, execute: vi.fn() },
    closeDatabaseConnection: vi.fn(),
  };
});

const { createApp } = await import('../../src/app.js');

describe('GET /api/v1/ingredients', () => {
  it('returns 200 with an empty paginated list and no auth required', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/ingredients?limit=10');

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty('total_items');
  });

  it('returns 422 when the query params fail validation', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/ingredients?limit=9999');

    expect(res.status).toBe(422);
    const body = await res.json() as Record<string, unknown>;
    expect(body.success).toBe(false);
  });
});

describe('POST /api/v1/admin/ingredients', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/admin/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Ingredient', risk_level: 'safe' }),
    });

    expect(res.status).toBe(401);
  });
});
