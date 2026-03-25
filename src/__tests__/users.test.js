'use strict';

const request = require('supertest');
const { createApp } = require('../app');

let app;

beforeEach(() => {
  // Fresh db per test for isolation
  app = createApp();
});

describe('GET /users', () => {
  test('returns 20 records by default', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
  });

  test('pagination metadata fields are present', async () => {
    const res = await request(app).get('/users');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('next_cursor');
    expect(res.body.pagination).toHaveProperty('has_more');
  });

  test('has_more is true when more records exist', async () => {
    const res = await request(app).get('/users');
    expect(res.body.pagination.has_more).toBe(true);
    expect(res.body.pagination.next_cursor).not.toBeNull();
  });

  test('custom limit is respected', async () => {
    const res = await request(app).get('/users?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('limit is clamped to max 100', async () => {
    const res = await request(app).get('/users?limit=200');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(100);
  });

  test('returns 400 for non-integer limit', async () => {
    const res = await request(app).get('/users?limit=abc');
    expect(res.status).toBe(400);
  });

  test('returns 400 for zero limit', async () => {
    const res = await request(app).get('/users?limit=0');
    expect(res.status).toBe(400);
  });

  test('returns 400 for negative limit', async () => {
    const res = await request(app).get('/users?limit=-5');
    expect(res.status).toBe(400);
  });

  test('cursor pagination returns next page', async () => {
    const page1 = await request(app).get('/users?limit=10');
    expect(page1.body.pagination.has_more).toBe(true);

    const cursor = page1.body.pagination.next_cursor;
    const page2 = await request(app).get(`/users?limit=10&cursor=${cursor}`);
    expect(page2.status).toBe(200);
    expect(page2.body.data).toHaveLength(10);

    // IDs on page 2 must all be greater than the last ID on page 1
    const lastIdPage1 = page1.body.data[page1.body.data.length - 1].id;
    for (const user of page2.body.data) {
      expect(user.id).toBeGreaterThan(lastIdPage1);
    }
  });

  test('last page has has_more=false and next_cursor=null', async () => {
    // With 50 rows and limit=10, page 5 is the last page
    let cursor = undefined;
    let lastRes;
    for (let i = 0; i < 5; i++) {
      const url = cursor ? `/users?limit=10&cursor=${cursor}` : '/users?limit=10';
      lastRes = await request(app).get(url);
      cursor = lastRes.body.pagination.next_cursor;
    }
    expect(lastRes.body.pagination.has_more).toBe(false);
    expect(lastRes.body.pagination.next_cursor).toBeNull();
  });

  test('returns 400 for garbage cursor', async () => {
    const res = await request(app).get('/users?cursor=!!!not-valid-base64!!!');
    expect(res.status).toBe(400);
  });

  test('cursor is opaque (base64 encoded)', async () => {
    const res = await request(app).get('/users?limit=5');
    const cursor = res.body.pagination.next_cursor;
    // A valid base64 string should only contain base64 characters
    expect(cursor).toMatch(/^[A-Za-z0-9+/]+=*$/);
    // Decoding it should not directly reveal the structure to a naive client
    // (i.e. it is not a plain number string as-is)
    expect(cursor).not.toMatch(/^\d+$/);
  });

  test('full traversal yields all 50 unique users', async () => {
    const allIds = new Set();
    let cursor = undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url = cursor ? `/users?limit=20&cursor=${cursor}` : '/users?limit=20';
      const res = await request(app).get(url);
      expect(res.status).toBe(200);
      for (const user of res.body.data) {
        allIds.add(user.id);
      }
      if (!res.body.pagination.has_more) break;
      cursor = res.body.pagination.next_cursor;
    }

    expect(allIds.size).toBe(50);
  });
});
