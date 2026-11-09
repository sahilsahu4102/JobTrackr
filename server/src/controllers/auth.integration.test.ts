// Run with: npm test. Needs MONGODB_URI (server/.env or the environment). These checks run
// against a throwaway database on that cluster, never your real data, and drop it at the end.
// Without a URI they are skipped. No AI calls are made, so no model quota is used.
import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';

const realUri = process.env.MONGODB_URI;
const parts = realUri?.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(\?.*)?$/);
const SKIP = parts ? false : 'MONGODB_URI is not set';
const dbName = `jobtrackr_test_${Date.now()}`;
Object.assign(process.env, {
  MONGODB_URI: parts ? `${parts[1]}/${dbName}${parts[2] ?? ''}` : 'mongodb://x',
  JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-123', // env.ts exits when these are missing
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? 'test',
});

let mongoose: typeof import('mongoose');
let User: typeof import('../models/User.js').User;
let Application: typeof import('../models/Application.js').Application;
let server: Server;
let base = '';

before(async () => {
  if (SKIP) return;
  mongoose = require('mongoose');
  ({ User } = require('../models/User.js'));
  ({ Application } = require('../models/Application.js'));
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth.routes.js').default);
  app.use('/api/applications', require('../routes/application.routes.js').default);
  app.use('/api/ai', require('../routes/ai.routes.js').default);
  app.use(require('../middleware/errorHandler.js').errorHandler);
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 15_000 });
  assert.equal(mongoose.connection.name, dbName);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
});

after(async () => {
  if (SKIP) return;
  server?.closeAllConnections();
  server?.close();
  if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase(); // only ever our own database
  await mongoose.disconnect();
});

const call = async (path: string, init: { method?: string; token?: string; body?: unknown } = {}) => {
  const res = await fetch(base + path, {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  return { status: res.status, body: (await res.json()) as any };
};
const guest = async () => {
  const r = await call('/auth/guest', { method: 'POST' });
  assert.equal(r.status, 201);
  return r.body.data as { user: { id: string; email: string; resumeText: string }; token: string };
};

test('guest login returns a token and a profile with a sample resume', { skip: SKIP }, async () => {
  const g = await guest();
  assert.ok(g.token.length > 20 && g.user.email.endsWith('@guest.jobtrackr.app'));
  assert.ok(g.user.resumeText.length > 100);
  const me = await call('/auth/me', { token: g.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.name, 'Guest');
});

test('a guest starts with sample applications in every board column', { skip: SKIP }, async () => {
  const g = await guest();
  const list = await call('/applications', { token: g.token });
  assert.equal(list.body.count, 6);
  const statuses = new Set(list.body.data.map((a: { status: string }) => a.status));
  assert.deepEqual([...statuses].sort(), ['Applied', 'Interview', 'Offer', 'Phone Screen', 'Rejected']);
});

test('a guest can add, move and delete applications', { skip: SKIP }, async () => {
  const g = await guest();
  const created = await call('/applications', { method: 'POST', token: g.token, body: { company: 'Test Co', role: 'Dev' } });
  assert.equal(created.status, 201);

  const list = await call('/applications', { token: g.token });
  const helix = list.body.data.find((a: { company: string }) => a.company === 'Helix Health');
  const moved = await call(`/applications/${helix._id}/status`, { method: 'PATCH', token: g.token, body: { status: 'Interview', order: 0 } });
  assert.equal(moved.status, 200);
  const after = await call('/applications', { token: g.token });
  assert.equal(after.body.data.find((a: { _id: string }) => a._id === helix._id).status, 'Interview');

  const del = await call(`/applications/${created.body.data._id}`, { method: 'DELETE', token: g.token });
  assert.equal(del.status, 200);
  assert.equal((await call('/applications', { token: g.token })).body.count, 6);
});

test('two guests never see or touch each others data', { skip: SKIP }, async () => {
  const a = await guest();
  const b = await guest();
  assert.notEqual(a.user.id, b.user.id);
  const aApps = (await call('/applications', { token: a.token })).body.data;
  const bApps = (await call('/applications', { token: b.token })).body.data;
  assert.equal(aApps.length + bApps.length, 12);
  assert.equal(new Set([...aApps, ...bApps].map((x: { _id: string }) => x._id)).size, 12);

  const steal = await call(`/applications/${aApps[0]._id}`, { method: 'DELETE', token: b.token });
  assert.equal(steal.status, 404);
  assert.equal((await call('/applications', { token: a.token })).body.count, 6);
});

test('expired guests and their applications are deleted when the next guest arrives', { skip: SKIP }, async () => {
  const old = await guest();
  const oldId = new mongoose.Types.ObjectId(old.user.id);
  await User.collection.updateOne({ _id: oldId }, { $set: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
  await guest(); // triggers the sweep
  assert.equal(await User.countDocuments({ _id: oldId }), 0);
  assert.equal(await Application.countDocuments({ userId: oldId }), 0);
  assert.equal((await call('/auth/me', { token: old.token })).status, 404);
});

test('guests younger than 24 hours are kept', { skip: SKIP }, async () => {
  const fresh = await guest();
  await guest();
  assert.equal((await call('/applications', { token: fresh.token })).body.count, 6);
});

test('no more than 200 guests exist at once', { skip: SKIP }, async () => {
  const now = new Date();
  await User.collection.insertMany(
    Array.from({ length: 200 }, (_, i) => ({ name: 'Guest', email: `filler-${i}@guest.jobtrackr.app`, password: 'x', isGuest: true, createdAt: now, updatedAt: now })),
  );
  try {
    assert.equal((await call('/auth/guest', { method: 'POST' })).status, 429);
  } finally {
    await User.deleteMany({ email: /^filler-/ });
  }
  assert.equal((await call('/auth/guest', { method: 'POST' })).status, 201); // works again once there is room
});

test('a guest address cannot be logged into with a guessed password', { skip: SKIP }, async () => {
  const g = await guest();
  const r = await call('/auth/login', { method: 'POST', body: { email: g.user.email, password: 'password123' } });
  assert.equal(r.status, 401);
});

test('regular sign-up and login still work, and duplicates are refused', { skip: SKIP }, async () => {
  const email = `qa-${Date.now()}@example.com`;
  const reg = await call('/auth/register', { method: 'POST', body: { name: 'QA User', email, password: 'secret123' } });
  assert.equal(reg.status, 201);
  assert.equal((await call('/auth/register', { method: 'POST', body: { name: 'QA User', email, password: 'secret123' } })).status, 400);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } })).status, 401);
  const login = await call('/auth/login', { method: 'POST', body: { email, password: 'secret123' } });
  assert.equal(login.status, 200);
  const upd = await call('/auth/profile', { method: 'PUT', token: login.body.data.token, body: { resumeText: 'My resume' } });
  assert.equal(upd.body.data.user.resumeText, 'My resume');
  assert.equal((await call('/applications', { token: login.body.data.token })).body.count, 0); // a real user gets no sample data
});

test('protected routes reject requests without a valid token', { skip: SKIP }, async () => {
  for (const path of ['/auth/me', '/applications', '/ai/parse-jd']) {
    assert.equal((await call(path, { method: path === '/ai/parse-jd' ? 'POST' : 'GET' })).status, 401, path);
  }
  assert.equal((await call('/applications', { token: 'not-a-real-token' })).status, 401);
});
