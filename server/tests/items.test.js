import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import {
  setupApp, teardownApp, clearDb, makeUser, makeAdmin, createItem, itemPayload, claimPayload, PNG,
} from './helpers.js';

let app, uploadDir;

beforeAll(async () => {
  ({ app, uploadDir } = await setupApp());
});

afterAll(teardownApp);

beforeEach(async () => {
  await clearDb();

  fs.rmSync(uploadDir, { recursive: true, force: true });
  fs.mkdirSync(uploadDir, { recursive: true });
});

describe('create item', () => {
  it('creates an item with owner info and default state', async () => {
    const { agent, user } = await makeUser(app);
    const res = await agent.post('/api/items').field(itemPayload());
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      type: 'found', title: 'Black wallet', status: 'open', hidden: false, imageUrl: null,
      owner: { id: user.id, name: user.name },
    });
    expect(res.body.item.id).toBeTruthy();
  });

  it('accepts JSON bodies too', async () => {
    const { agent } = await makeUser(app);
    await agent.post('/api/items').send(itemPayload({ type: 'lost' })).expect(201);
  });

  it('does not let the client set owner/status/hidden', async () => {
    const { agent, user } = await makeUser(app);
    const other = await makeUser(app);
    const res = await agent.post('/api/items').send(itemPayload({ owner: other.user.id, status: 'resolved', hidden: true }));
    expect(res.status).toBe(201);
    expect(res.body.item.owner.id).toBe(user.id);
    expect(res.body.item.status).toBe('open');
    expect(res.body.item.hidden).toBe(false);
  });

  it.each([
    ['short title', { title: 'ab' }, 'title'],
    ['short description', { description: 'too short' }, 'description'],
    ['bad category', { category: 'weapons' }, 'category'],
    ['bad type', { type: 'stolen' }, 'type'],
    ['short location', { location: 'x' }, 'location'],
    ['future date', { date: new Date(Date.now() + 5 * 86400000).toISOString() }, 'date'],
    ['invalid date', { date: 'yesterday-ish' }, 'date'],
    ['long title', { title: 'x'.repeat(101) }, 'title'],
  ])('rejects %s', async (_l, patch, field) => {
    const { agent } = await makeUser(app);
    const res = await agent.post('/api/items').field(itemPayload(patch));
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
  });

  describe('image upload', () => {
    it('stores a valid PNG and serves it from /uploads', async () => {
      const { agent } = await makeUser(app);
      const res = await agent.post('/api/items').field(itemPayload()).attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(201);
      expect(res.body.item.imageUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
      const file = await request(app).get(res.body.item.imageUrl);
      expect(file.status).toBe(200);
      expect(file.headers['content-type']).toMatch(/image\/png/);
    });

    it('rejects a non-image mime type', async () => {
      const { agent } = await makeUser(app);
      const res = await agent.post('/api/items').field(itemPayload())
        .attach('image', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/JPEG, PNG or WebP/);
    });

    it('rejects a file whose bytes are not an image even if mime claims png', async () => {
      const { agent } = await makeUser(app);
      const res = await agent.post('/api/items').field(itemPayload())
        .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(fs.readdirSync(uploadDir)).toHaveLength(0);
    });

    it('rejects files over 2MB', async () => {
      const { agent } = await makeUser(app);
      const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 + 10)]);
      const res = await agent.post('/api/items').field(itemPayload())
        .attach('image', big, { filename: 'big.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/2MB/);
    });

    it('does not keep the file when validation of the other fields fails', async () => {
      const { agent } = await makeUser(app);
      const before = fs.readdirSync(uploadDir).length;
      const res = await agent.post('/api/items').field(itemPayload({ title: 'x' }))
        .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      await new Promise((r) => setTimeout(r, 100));
      expect(fs.readdirSync(uploadDir).length).toBe(before);
    });
  });
});

describe('read item', () => {
  it('is public and returns claimCount', async () => {
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({ id: item.id, claimCount: 0 });
  });

  it('returns 404 for invalid and missing ids', async () => {
    await request(app).get('/api/items/not-an-id').expect(404);
    await request(app).get('/api/items/507f1f77bcf86cd799439011').expect(404);
  });

  it('GET /mine only returns the caller\'s items and is not shadowed by /:id', async () => {
    const a = await makeUser(app);
    const b = await makeUser(app);
    await createItem(a.agent, { title: 'Mine one' });
    await createItem(b.agent, { title: 'Theirs one' });
    const res = await a.agent.get('/api/items/mine');
    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.title)).toEqual(['Mine one']);
  });
});

describe('update / close / delete authorization', () => {
  it('owner can update fields; response reflects them', async () => {
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    const res = await agent.patch(`/api/items/${item.id}`).send({ title: 'Brown wallet', location: 'Library' });
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({ title: 'Brown wallet', location: 'Library', type: 'found' });
  });

  it('owner can patch via multipart and replace the image (old file removed)', async () => {
    const { agent } = await makeUser(app);
    const created = await agent.post('/api/items').field(itemPayload()).attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    const oldFile = path.join(uploadDir, path.basename(created.body.item.imageUrl));
    expect(fs.existsSync(oldFile)).toBe(true);
    const res = await agent.patch(`/api/items/${created.body.item.id}`).field({ title: 'New title here' })
      .attach('image', PNG, { filename: 'b.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.item.imageUrl).not.toBe(created.body.item.imageUrl);
    await new Promise((r) => setTimeout(r, 100));
    expect(fs.existsSync(oldFile)).toBe(false);
  });

  it('non-owner gets 403 on PATCH, close and DELETE; unauthenticated gets 401', async () => {
    const owner = await makeUser(app);
    const other = await makeUser(app);
    const item = await createItem(owner.agent);
    await other.agent.patch(`/api/items/${item.id}`).send({ title: 'Hacked title' }).expect(403);
    await other.agent.post(`/api/items/${item.id}/close`).expect(403);
    await other.agent.delete(`/api/items/${item.id}`).expect(403);
    await request(app).delete(`/api/items/${item.id}`).expect(401);
    const still = await request(app).get(`/api/items/${item.id}`);
    expect(still.body.item.title).toBe('Black wallet');
  });

  it('non-owner cannot upload through PATCH (no file left behind)', async () => {
    const owner = await makeUser(app);
    const other = await makeUser(app);
    const item = await createItem(owner.agent);
    const res = await other.agent.patch(`/api/items/${item.id}`).field({ title: 'Other title' })
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
    expect(fs.readdirSync(uploadDir)).toHaveLength(0);
  });

  it('PATCH cannot change owner, type or hidden', async () => {
    const owner = await makeUser(app);
    const other = await makeUser(app);
    const item = await createItem(owner.agent);
    const res = await owner.agent.patch(`/api/items/${item.id}`).send({ owner: other.user.id, type: 'lost', hidden: true });
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({ type: 'found', hidden: false, owner: { id: owner.user.id } });
  });

  it('owner may set status closed/open but not resolved; admin may', async () => {
    const owner = await makeUser(app);
    const admin = await makeAdmin(app);
    const item = await createItem(owner.agent);
    const closed = await owner.agent.patch(`/api/items/${item.id}`).send({ status: 'closed' });
    expect(closed.body.item.status).toBe('closed');
    const reopened = await owner.agent.patch(`/api/items/${item.id}`).send({ status: 'open' });
    expect(reopened.body.item.status).toBe('open');
    await owner.agent.patch(`/api/items/${item.id}`).send({ status: 'resolved' }).expect(403);
    const byAdmin = await admin.agent.patch(`/api/items/${item.id}`).send({ status: 'resolved' });
    expect(byAdmin.status).toBe(200);
  });

  it('validates PATCH payload', async () => {
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    const res = await agent.patch(`/api/items/${item.id}`).send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  it('owner can close', async () => {
    const { agent } = await makeUser(app);
    const item = await createItem(agent);
    const res = await agent.post(`/api/items/${item.id}/close`);
    expect(res.status).toBe(200);
    expect(res.body.item.status).toBe('closed');
  });

  it('admin can edit and delete any item', async () => {
    const owner = await makeUser(app);
    const admin = await makeAdmin(app);
    const item = await createItem(owner.agent);
    await admin.agent.patch(`/api/items/${item.id}`).send({ title: 'Moderated title' }).expect(200);
    await admin.agent.delete(`/api/items/${item.id}`).expect(200);
  });

  it('owner delete removes the item, its claims and image', async () => {
    const owner = await makeUser(app);
    const claimer = await makeUser(app);
    const created = await owner.agent.post('/api/items').field(itemPayload()).attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    const id = created.body.item.id;
    await claimer.agent.post(`/api/items/${id}/claims`).send(claimPayload()).expect(201);
    const res = await owner.agent.delete(`/api/items/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    await request(app).get(`/api/items/${id}`).expect(404);
    const mine = await claimer.agent.get('/api/claims/mine');
    expect(mine.body.claims).toHaveLength(0);
    await new Promise((r) => setTimeout(r, 100));
    expect(fs.readdirSync(uploadDir)).toHaveLength(0);
  });
});

describe('list: search / filter / pagination', () => {
  beforeEach(async () => {
    const { agent } = await makeUser(app);
    await createItem(agent, { title: 'Red umbrella', type: 'lost', category: 'other', location: 'Library' });
    await createItem(agent, { title: 'Blue notebook', type: 'found', category: 'books', location: 'Gym', description: 'Spiral notebook with physics notes inside.' });
    await createItem(agent, { title: 'Laptop (Dell)', type: 'found', category: 'electronics', location: 'Lab 1.2' });
    await createItem(agent, { title: 'House keys', type: 'lost', category: 'keys', location: 'Parking lot' });
  });

  it('returns the pagination shape with defaults', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 9, total: 4, totalPages: 1 });
    expect(res.body.items).toHaveLength(4);
    expect(res.body.items[0].owner).toEqual({ id: expect.any(String), name: expect.any(String) });
  });

  it('paginates', async () => {
    const p1 = await request(app).get('/api/items?limit=3&page=1');
    const p2 = await request(app).get('/api/items?limit=3&page=2');
    expect(p1.body).toMatchObject({ total: 4, totalPages: 2, limit: 3, page: 1 });
    expect(p1.body.items).toHaveLength(3);
    expect(p2.body.items).toHaveLength(1);
    const ids = new Set([...p1.body.items, ...p2.body.items].map((i) => i.id));
    expect(ids.size).toBe(4);
  });

  it('sorts newest first', async () => {
    const res = await request(app).get('/api/items');
    expect(res.body.items[0].title).toBe('House keys');
  });

  it('filters by type, category and status', async () => {
    expect((await request(app).get('/api/items?type=lost')).body.total).toBe(2);
    expect((await request(app).get('/api/items?category=books')).body.items.map((i) => i.title)).toEqual(['Blue notebook']);
    expect((await request(app).get('/api/items?status=resolved')).body.total).toBe(0);
    expect((await request(app).get('/api/items?type=found&category=electronics')).body.total).toBe(1);
  });

  it('searches title, description and location case-insensitively', async () => {
    expect((await request(app).get('/api/items?search=UMBRELLA')).body.total).toBe(1);
    expect((await request(app).get('/api/items?search=physics')).body.total).toBe(1);
    expect((await request(app).get('/api/items?search=parking')).body.total).toBe(1);
    expect((await request(app).get('/api/items?location=lab')).body.total).toBe(1);
  });

  it('escapes regex metacharacters in search', async () => {
    expect((await request(app).get('/api/items?search=(Dell)')).body.total).toBe(1);
    expect((await request(app).get('/api/items?search=.*')).body.total).toBe(0);
    expect((await request(app).get('/api/items?search=1.2')).body.total).toBe(1);
    expect((await request(app).get('/api/items?search=1x2')).body.total).toBe(0);
  });

  it('falls back to defaults on junk paging and rejects bad enum filters', async () => {
    const ok = await request(app).get('/api/items?page=abc&limit=-5');
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ page: 1, limit: 9 });
    await request(app).get('/api/items?type=bogus').expect(400);
  });

  it('ignores operator injection in query params', async () => {
    const res = await request(app).get('/api/items?type[$ne]=lost');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
  });

  it('excludes hidden items from the public list and from other users\' detail view', async () => {
    const { agent } = await makeUser(app);
    const item = await createItem(agent, { title: 'Secret thing' });
    const admin = await makeAdmin(app);
    await admin.agent.patch(`/api/admin/items/${item.id}/hide`).send({ hidden: true }).expect(200);
    const list = await request(app).get('/api/items?search=Secret');
    expect(list.body.total).toBe(0);
    await request(app).get(`/api/items/${item.id}`).expect(404);
    await agent.get(`/api/items/${item.id}`).expect(200); // owner still sees it
    await admin.agent.get(`/api/items/${item.id}`).expect(200);
  });
});
