import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupApp, teardownApp, clearDb, makeUser, makeAdmin, createItem, claimPayload } from './helpers.js';

let app;
beforeAll(async () => { ({ app } = await setupApp()); });
afterAll(teardownApp);
beforeEach(clearDb);

async function scenario() {
  const owner = await makeUser(app);
  const c1 = await makeUser(app);
  const c2 = await makeUser(app);
  const item = await createItem(owner.agent);
  return { owner, c1, c2, item };
}

describe('create claim', () => {
  it('creates a pending claim including the claimant\'s own proof', async () => {
    const { c1, item } = await scenario();
    const res = await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload());
    expect(res.status).toBe(201);
    expect(res.body.claim).toMatchObject({
      item: item.id, status: 'pending', claimant: { id: c1.user.id, name: c1.user.name },
      message: claimPayload().message, proof: claimPayload().proof,
    });
  });

  it('requires authentication', async () => {
    const { item } = await scenario();
    await request(app).post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(401);
  });

  it('is not allowed on lost items', async () => {
    const owner = await makeUser(app);
    const other = await makeUser(app);
    const lost = await createItem(owner.agent, { type: 'lost' });
    const res = await other.agent.post(`/api/items/${lost.id}/claims`).send(claimPayload());
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/found items/i);
  });

  it('is forbidden on your own item', async () => {
    const { owner, item } = await scenario();
    await owner.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(403);
  });

  it('returns 409 for a duplicate claim by the same user', async () => {
    const { c1, item } = await scenario();
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(201);
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(409);
  });

  it('returns 409 for a concurrent duplicate (unique index backstop)', async () => {
    const { c1, item } = await scenario();
    const results = await Promise.all([1, 2, 3].map(() => c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload())));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(2);
  });

  it('is not allowed once the item is closed/resolved', async () => {
    const { owner, c1, item } = await scenario();
    await owner.agent.post(`/api/items/${item.id}/close`).expect(200);
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(409);
  });

  it('404s for hidden items and missing items', async () => {
    const { c1, item } = await scenario();
    const admin = await makeAdmin(app);
    await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({ hidden: true }).expect(200);
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(404);
    await c1.agent.post('/api/items/507f1f77bcf86cd799439011/claims').send(claimPayload()).expect(404);
  });

  it('validates message and proof lengths', async () => {
    const { c1, item } = await scenario();
    const res = await c1.agent.post(`/api/items/${item.id}/claims`).send({ message: 'short', proof: 'tiny' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['message', 'proof']);
    const long = await c1.agent.post(`/api/items/${item.id}/claims`).send({ ...claimPayload(), message: 'x'.repeat(501) });
    expect(long.status).toBe(400);
  });
});

describe('proof privacy', () => {
  it('claim list is visible to owner and admin (with proof) but not other users or anonymous', async () => {
    const { owner, c1, c2, item } = await scenario();
    const admin = await makeAdmin(app);
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload({ proof: 'secret proof text 123' })).expect(201);

    const asOwner = await owner.agent.get(`/api/items/${item.id}/claims`);
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.claims).toHaveLength(1);
    expect(asOwner.body.claims[0].proof).toBe('secret proof text 123');

    const asAdmin = await admin.agent.get(`/api/items/${item.id}/claims`);
    expect(asAdmin.body.claims[0].proof).toBe('secret proof text 123');

    await c2.agent.get(`/api/items/${item.id}/claims`).expect(403);
    await c1.agent.get(`/api/items/${item.id}/claims`).expect(403);
    await request(app).get(`/api/items/${item.id}/claims`).expect(401);
  });

  it('proof never appears in public item endpoints', async () => {
    const { c1, item } = await scenario();
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload({ proof: 'secret proof text 123' }));
    for (const url of [`/api/items/${item.id}`, '/api/items']) {
      const res = await request(app).get(url);
      expect(JSON.stringify(res.body)).not.toContain('secret proof text 123');
    }
    const detail = await request(app).get(`/api/items/${item.id}`);
    expect(detail.body.item.claimCount).toBe(1);
  });

  it('/claims/mine returns only own claims with populated item', async () => {
    const { c1, c2, item } = await scenario();
    await c1.agent.post(`/api/items/${item.id}/claims`).send(claimPayload()).expect(201);
    await c2.agent.post(`/api/items/${item.id}/claims`).send(claimPayload({ proof: 'c2 private proof here' })).expect(201);
    const res = await c1.agent.get('/api/claims/mine');
    expect(res.status).toBe(200);
    expect(res.body.claims).toHaveLength(1);
    expect(res.body.claims[0].item).toEqual({ id: item.id, title: 'Black wallet', type: 'found', status: 'open' });
    expect(JSON.stringify(res.body)).not.toContain('c2 private proof here');
  });
});

describe('review claims', () => {
  async function withClaims() {
    const s = await scenario();
    const r1 = await s.c1.agent.post(`/api/items/${s.item.id}/claims`).send(claimPayload()).expect(201);
    const r2 = await s.c2.agent.post(`/api/items/${s.item.id}/claims`).send(claimPayload()).expect(201);
    return { ...s, claim1: r1.body.claim, claim2: r2.body.claim };
  }

  it('accepting resolves the item and auto-rejects the other pending claims', async () => {
    const { owner, c1, c2, item, claim1, claim2 } = await withClaims();
    const res = await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.claim).toMatchObject({ id: claim1.id, status: 'accepted', item: { id: item.id, status: 'resolved' } });

    const detail = await request(app).get(`/api/items/${item.id}`);
    expect(detail.body.item.status).toBe('resolved');
    const c1Claims = await c1.agent.get('/api/claims/mine');
    expect(c1Claims.body.claims[0].status).toBe('accepted');
    const c2Claims = await c2.agent.get('/api/claims/mine');
    expect(c2Claims.body.claims[0].status).toBe('rejected');
    expect(claim2.status).toBe('pending');
  });

  it('rejecting leaves the item open and other claims pending', async () => {
    const { owner, c2, item, claim1 } = await withClaims();
    const res = await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'rejected' });
    expect(res.body.claim.status).toBe('rejected');
    expect((await request(app).get(`/api/items/${item.id}`)).body.item.status).toBe('open');
    expect((await c2.agent.get('/api/claims/mine')).body.claims[0].status).toBe('pending');
  });

  it('only owner/admin may review; others get 403, anonymous 401', async () => {
    const { c1, c2, claim1 } = await withClaims();
    const admin = await makeAdmin(app);
    await c1.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(403); // claimant cannot self-accept
    await c2.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(403);
    await request(app).patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(401);
    await admin.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(200);
  });

  it('a reviewed claim cannot be reviewed again (409)', async () => {
    const { owner, claim1 } = await withClaims();
    await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'rejected' }).expect(200);
    await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(409);
  });

  it('auto-rejected claims cannot subsequently be accepted', async () => {
    const { owner, claim1, claim2 } = await withClaims();
    await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'accepted' }).expect(200);
    await owner.agent.patch(`/api/claims/${claim2.id}`).send({ status: 'accepted' }).expect(409);
  });

  it('validates status value and id', async () => {
    const { owner, claim1 } = await withClaims();
    await owner.agent.patch(`/api/claims/${claim1.id}`).send({ status: 'pending' }).expect(400);
    await owner.agent.patch(`/api/claims/${claim1.id}`).send({}).expect(400);
    await owner.agent.patch('/api/claims/nope').send({ status: 'accepted' }).expect(404);
    await owner.agent.patch('/api/claims/507f1f77bcf86cd799439011').send({ status: 'accepted' }).expect(404);
  });
});
