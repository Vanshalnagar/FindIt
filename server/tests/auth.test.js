import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupApp, teardownApp, clearDb, makeUser, PASSWORD } from './helpers.js';

let app;
beforeAll(async () => { ({ app } = await setupApp()); });
afterAll(teardownApp);
beforeEach(clearDb);

const valid = { name: 'Alice Smith', email: 'Alice@Example.test', password: PASSWORD };

describe('POST /api/auth/register', () => {
  it('creates a student, lowercases email, logs in and never leaks the hash', async () => {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), name: 'Alice Smith', email: 'alice@example.test', role: 'student' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(res.headers['set-cookie'].join(';')).toMatch(/findit\.sid=.*HttpOnly.*SameSite=Lax/i);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('alice@example.test');
  });

  it('ignores a client-supplied role (no privilege escalation)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student');
  });

  it.each([
    ['short password', { password: 'abc1' }, 'password'],
    ['no digit', { password: 'onlyletters' }, 'password'],
    ['no letter', { password: '123456789' }, 'password'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['short name', { name: 'A' }, 'name'],
    ['missing name', { name: undefined }, 'name'],
  ])('rejects %s with 400 and field details', async (_l, patch, field) => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBeTruthy();
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('returns 409 for a duplicate email (case-insensitive)', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const res = await request(app).post('/api/auth/register').send({ ...valid, email: 'ALICE@example.test' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already exists/i);
  });
});

describe('login / logout / me', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email: 'alice@example.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Alice Smith');
    await agent.get('/api/auth/me').expect(200);
  });

  it('gives the same 401 for wrong password and unknown email', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const a = await request(app).post('/api/auth/login').send({ email: 'alice@example.test', password: 'Wrong1234' });
    const b = await request(app).post('/api/auth/login').send({ email: 'nobody@example.test', password: 'Wrong1234' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body).toEqual(b.body);
  });

  it('validates login body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('rejects NoSQL operator injection in login', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  it('logout destroys the session', async () => {
    const { agent } = await makeUser(app);
    await agent.get('/api/auth/me').expect(200);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ ok: true });
    await agent.get('/api/auth/me').expect(401);
  });

  it('GET /me is 401 without a session, in the contract error format', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: expect.any(String) } });
  });
});

describe('protected routes', () => {
  it.each([
    ['post', '/api/items'],
    ['get', '/api/items/mine'],
    ['get', '/api/claims/mine'],
    ['get', '/api/admin/stats'],
  ])('%s %s requires auth', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});
