import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';

export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let uploadDir;

/** Connects to a fresh database on the shared in-memory server and builds the app. */
export async function setupApp() {
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'findit-uploads-'));
  process.env.UPLOAD_DIR = uploadDir;
  const base = process.env.MONGO_TEST_URI;
  await mongoose.connect(`${base}findit_${crypto.randomBytes(4).toString('hex')}`);
  const { createApp } = await import('../src/app.js');
  for (const m of Object.values(mongoose.models)) await m.init();
  return { app: createApp(), uploadDir };
}

export async function teardownApp() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(uploadDir, { recursive: true, force: true });
}

export async function clearDb() {
  for (const m of Object.values(mongoose.models)) await m.deleteMany({});
}

let n = 0;
export const PASSWORD = 'Passw0rdOK';

/** Registers a user via the API and returns a logged-in agent. */
export async function makeUser(app, overrides = {}) {
  n += 1;
  const body = { name: `User ${n}`, email: `user${n}-${Date.now()}@example.test`, password: PASSWORD, ...overrides };
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, email: body.email };
}

export async function makeAdmin(app) {
  const { User } = await import('../src/models/User.js');
  n += 1;
  const email = `admin${n}-${Date.now()}@example.test`;
  await User.create({ name: 'Admin', email, role: 'admin', passwordHash: await bcrypt.hash(PASSWORD, 4) });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error('admin login failed');
  return { agent, user: res.body.user };
}

export const itemPayload = (overrides = {}) => ({
  type: 'found',
  title: 'Black wallet',
  description: 'A black leather wallet found near the cafeteria entrance.',
  category: 'accessories',
  location: 'Cafeteria',
  date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
  ...overrides,
});

export async function createItem(agent, overrides = {}) {
  const res = await agent.post('/api/items').field(itemPayload(overrides));
  if (res.status !== 201) throw new Error(`createItem failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.item;
}

export const claimPayload = (o = {}) => ({
  message: 'I believe this is my wallet.',
  proof: 'It contains a library card with my name.',
  ...o,
});
