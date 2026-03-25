'use strict';

const request = require('supertest');
const app = require('../src/app');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Request ID middleware', () => {
  test('sets x-request-id header on response', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  test('x-request-id is a valid UUID v4', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-request-id']).toMatch(UUID_REGEX);
  });

  test('generates unique request ids per request', async () => {
    const [res1, res2] = await Promise.all([
      request(app).get('/'),
      request(app).get('/'),
    ]);
    expect(res1.headers['x-request-id']).not.toBe(res2.headers['x-request-id']);
  });

  test('uses provided x-request-id header if present', async () => {
    const customId = '123e4567-e89b-42d3-a456-426614174000';
    const res = await request(app).get('/').set('x-request-id', customId);
    expect(res.headers['x-request-id']).toBe(customId);
  });

  test('response body includes requestId', async () => {
    const res = await request(app).get('/');
    expect(res.body.requestId).toBeDefined();
    expect(res.body.requestId).toMatch(UUID_REGEX);
  });

  test('x-request-id in header matches requestId in body', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});

describe('HTTP endpoints', () => {
  test('GET / returns 200 with message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello World');
  });

  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /error returns 500', async () => {
    const res = await request(app).get('/error');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });

  test('GET /warn returns 200', async () => {
    const res = await request(app).get('/warn');
    expect(res.status).toBe(200);
    expect(res.body.warn).toBe(true);
  });

  test('GET /debug returns 200', async () => {
    const res = await request(app).get('/debug');
    expect(res.status).toBe(200);
    expect(res.body.debug).toBe(true);
  });
});

describe('LOG_LEVEL configuration', () => {
  const originalLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    if (originalLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLevel;
    }
  });

  test('logger module respects LOG_LEVEL env var', () => {
    process.env.LOG_LEVEL = 'debug';
    // Re-require to pick up new env var
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('debug');
  });

  test('logger defaults to info when LOG_LEVEL not set', () => {
    delete process.env.LOG_LEVEL;
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('info');
  });

  test('logger supports error level', () => {
    process.env.LOG_LEVEL = 'error';
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('error');
  });

  test('logger supports warn level', () => {
    process.env.LOG_LEVEL = 'warn';
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('warn');
  });

  test('logger supports info level', () => {
    process.env.LOG_LEVEL = 'info';
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('info');
  });

  test('logger supports debug level', () => {
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();
    const logger = require('../src/logger');
    expect(logger.level).toBe('debug');
  });
});

describe('JSON log structure', () => {
  test('logger has expected pino methods', () => {
    const logger = require('../src/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('logger is a pino instance with level property', () => {
    const logger = require('../src/logger');
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('string');
  });

  test('app uses pino-http which attaches log to req', async () => {
    // If req.log is not available, routes would throw - verify routes work
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});
