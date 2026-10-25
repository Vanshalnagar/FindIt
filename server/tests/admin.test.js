import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupApp, teardownApp, clearDb, makeUser, makeAdmin, createItem, claimPayload } from './helpers.js';

let app;
beforeAll(async () => { ({ app } = await setupApp()); });
afterAll(teardownApp);
beforeEach(clearDb);

describe('admin authorization', () => {
  it.each([
    ['get', '/api/admin/stats', undefined],
    ['get', '/api/admin/items', undefined],
    ['get', '/api/admin/users', undefined],
    ['patch', '/api/admin/items/507f1f77bcf86cd799439011/hide', { hidden: true }],
  ])('%s %s -> 401 anonymous, 403 for students', async (method, url, body) => {
    const anon = await request(app)[method](url).send(body);
    expect(anon.status).toBe(401);
    const { agent } = await makeUser(app);
    const student = await agent[method](url).send(body);
    expect(student.status).toBe(403);
    expect(student.body.error.message).toMatch(/admin/i);
  });
});

describe('admin endpoints', () => {
  it('stats counts everything correctly', async () => {
    const admin = await makeAdmin(app);
    const a = await makeUser(app);
    const b = await makeUser(app);
    const found1 = await createItem(a.agent, { type: 'found' });
    const found2 = await createItem(a.agent, { type: 'found', title: 'Second found' });
    await createItem(a.agent, { type: 'lost', title: 'A lost thing' });
    const lost2 = await createItem(b.agent, { type: 'lost', title: 'Another lost' });
    await b.agent.post(`/api/items/${found1.id}/claims`).send(claimPayload()).expect(201);
    const c = await b.agent.post(`/api/items/${found2.id}/claims`).send(claimPayload()).expect(201);
    await a.agent.patch(`/api/claims/${c.body.claim.id}`).send({ status: 'accepted' }).expect(200); // found2 resolved
    await b.agent.post(`/api/items/${lost2.id}/close`).expect(200);
    await admin.agent.patch(`/api/admin/items/${found1.id}/hide`).send({ hidden: true }).expect(200);

    const res = await admin.agent.get('/api/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      users: 3, items: 4, lostItems: 2, foundItems: 2, openItems: 2, resolvedItems: 1, closedItems: 1,
      hiddenItems: 1, pendingClaims: 1, totalClaims: 2,
    });
  });

  it('lists items including hidden, with pagination and status filter', async () => {
    const admin = await makeAdmin(app);
    const { agent } = await makeUser(app);
    const first = await createItem(agent, { title: 'First item' });
    await createItem(agent, { title: 'Second item' });
    await createItem(agent, { title: 'Third item' });
    await admin.agent.patch(`/api/admin/items/${first.id}/hide`).send({ hidden: true });
    await agent.post(`/api/items/${(await createItem(agent, { title: 'Closed item' })).id}/close`);

    const all = await admin.agent.get('/api/admin/items?limit=3&page=1');
    expect(all.body).toMatchObject({ page: 1, limit: 3, total: 4, totalPages: 2 });
    expect(all.body.items).toHaveLength(3);
    const page2 = await admin.agent.get('/api/admin/items?limit=3&page=2');
    expect(page2.body.items).toHaveLength(1);
    const hidden = [...all.body.items, ...page2.body.items].find((i) => i.id === first.id);
    expect(hidden.hidden).toBe(true);
    const closed = await admin.agent.get('/api/admin/items?status=closed');
    expect(closed.body.items.map((i) => i.title)).toEqual(['Closed item']);
  });

  it('hide/unhide toggles public visibility', async () => {
    const admin = await makeAdmin(app);
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    const hide = await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({ hidden: true });
    expect(hide.status).toBe(200);
    expect(hide.body.item.hidden).toBe(true);
    expect((await request(app).get('/api/items')).body.total).toBe(0);
    const unhide = await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({ hidden: false });
    expect(unhide.body.item.hidden).toBe(false);
    expect((await request(app).get('/api/items')).body.total).toBe(1);
  });

  it('hide validates body and id', async () => {
    const admin = await makeAdmin(app);
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({ hidden: 'yes' }).expect(400);
    await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({}).expect(400);
    await admin.agent.patch('/api/admin/items/bad-id/hide').send({ hidden: true }).expect(404);
    await admin.agent.patch('/api/admin/items/507f1f77bcf86cd799439011/hide').send({ hidden: true }).expect(404);
  });

  it('lists users without password hashes', async () => {
    const admin = await makeAdmin(app);
    await makeUser(app);
    const res = await admin.agent.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).toEqual(expect.objectContaining({ id: expect.any(String), email: expect.any(String), role: expect.any(String) }));
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
});
