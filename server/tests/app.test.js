import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

process.env.CLIENT_URL = 'http://localhost:5173';
test('health endpoint responds without database access', async () => {
  const response = await request(createApp()).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});
test('unknown endpoints return the centralized Arabic error', async () => {
  const response = await request(createApp()).get('/api/not-found');
  assert.equal(response.status, 404);
  assert.match(response.body.message, /المسار غير موجود/);
});
