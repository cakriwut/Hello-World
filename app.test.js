const request = require('supertest');
const app = require('./app');

describe('GET /health', () => {
  it('should return 200 status code', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  it('should return status field with value "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('should return a valid ISO8601 timestamp', async () => {
    const res = await request(app).get('/health');
    const timestamp = res.body.timestamp;
    expect(timestamp).toBeDefined();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
