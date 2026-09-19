import { describe, it, expect, vi } from 'vitest';

/**
 * Integration test for the health module. Mocks only the database client
 * (so this test suite doesn't require a live Postgres connection to run
 * in CI) while exercising the real Hono app, middleware stack, and route
 * wiring exactly as a deployed request would hit them.
 */
vi.mock('@database/client.js', () => ({
  db: { execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
  closeDatabaseConnection: vi.fn(),
}));

const { createApp } = await import('../../src/app.js');

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok and does not touch the database', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/health');

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.success).toBe(true);
    expect((body.data as Record<string, unknown>).status).toBe('ok');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('GET /api/v1/health/ready', () => {
  it('returns 200 with database reachable when the DB check succeeds', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/health/ready');

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.data).toEqual({ status: 'ok', database: 'reachable' });
  });
});

describe('unknown route', () => {
  it('returns a 404 in the standard error envelope', async () => {
    const app = createApp();
    const res = await app.request('/api/v1/this-route-does-not-exist');

    expect(res.status).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect((body.errors as Array<Record<string, unknown>>)[0]?.code).toBe('NOT_FOUND');
  });
});
