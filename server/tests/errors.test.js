import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupApp, teardownApp, clearDb, makeUser, itemPayload } from './helpers.js';

let app;
beforeAll(async () => { ({ app } = await setupApp()); });
afterAll(teardownApp);
beforeEach(clearDb);

describe('health', () => {
  it('GET /api/health is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('error format', () => {
  it('unknown routes -> 404 JSON in contract format', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: expect.any(String) } });
  });

  it('validation errors include details[{field,message}]', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'x', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    for (const d of res.body.error.details) expect(d).toEqual({ field: expect.any(String), message: expect.any(String) });
  });

  it('malformed JSON -> 400 in contract format', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/json/i);
  });

  it('forbidden / unauthorized / not found / conflict all use { error: { message } }', async () => {
    const a = await makeUser(app);
    const b = await makeUser(app);
    const item = (await a.agent.post('/api/items').send(itemPayload())).body.item;
    const responses = [
      await request(app).post('/api/items').send(itemPayload()),                 // 401
      await b.agent.delete(`/api/items/${item.id}`),                             // 403
      await request(app).get('/api/items/507f1f77bcf86cd799439011'),             // 404
      await request(app).post('/api/auth/register').send({ name: 'Dup', email: a.email, password: 'Passw0rdOK' }), // 409
    ];
    expect(responses.map((r) => r.status)).toEqual([401, 403, 404, 409]);
    for (const r of responses) expect(r.body).toEqual({ error: { message: expect.any(String) } });
  });

  it('does not leak stack traces', async () => {
    const res = await request(app).get('/api/items/not-an-id');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js|stack/i);
  });
});

describe('request hardening', () => {
  it('strips $-prefixed and dotted keys from JSON bodies', async () => {
    const { agent } = await makeUser(app);
    const res = await agent.post('/api/items').send({ ...itemPayload(), $where: '1', 'a.b': 'x', title: 'Clean title' });
    expect(res.status).toBe(201);
    expect(res.body.item.title).toBe('Clean title');
  });

  it('origin check blocks state-changing requests from foreign origins', async () => {
    const { agent } = await makeUser(app);
    const res = await agent.post('/api/items').set('Origin', 'http://evil.example').send(itemPayload());
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/origin/i);
  });

  it('origin check allows the configured client origin and GETs from anywhere', async () => {
    const { agent } = await makeUser(app);
    await agent.post('/api/items').set('Origin', 'http://localhost:5173').send(itemPayload()).expect(201);
    await request(app).get('/api/items').set('Origin', 'http://evil.example').expect(200);
  });

  it('CORS reflects only the allowed origin with credentials', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects oversized JSON bodies', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body.error.message).toBeTruthy();
  });
});
