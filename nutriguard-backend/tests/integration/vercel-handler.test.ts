import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import request from 'supertest';
import { handle } from '@hono/node-server/vercel';

vi.mock('@database/client.js', () => ({
  db: { execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
  closeDatabaseConnection: vi.fn(),
}));

const { createApp } = await import('../../src/app.js');

describe('Vercel serverless handler (@hono/node-server/vercel)', () => {
  const app = createApp();
  const server = http.createServer(handle(app));

  it('handles GET request without throwing TypeError on c.req.header', async () => {
    const res = await request(server).get('/api/v1/health').expect(200).expect('content-type', /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    // Ensure request-id middleware executed and attached header successfully
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });

  it('preserves incoming custom request ID', async () => {
    const customId = 'custom-test-req-id-12345';
    const res = await request(server).get('/api/v1/health').set('x-request-id', customId).expect(200);

    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('correctly handles 404 routes through Node ServerResponse', async () => {
    const res = await request(server).get('/api/v1/non-existent-endpoint').expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.errors[0]?.code).toBe('NOT_FOUND');
  });
});
