import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../src/app'

describe('Fastify pino logging app', () => {
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    app = buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /health', () => {
    it('returns 200 with status ok and requestId', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ status: string; requestId: string }>()
      expect(body.status).toBe('ok')
      expect(typeof body.requestId).toBe('string')
      expect(body.requestId.length).toBeGreaterThan(0)
    })

    it('propagates X-Request-Id header as the request id', async () => {
      const customId = 'my-custom-request-id'
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-request-id': customId },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ requestId: string }>()
      expect(body.requestId).toBe(customId)
    })

    it('generates a unique UUID when no X-Request-Id is provided', async () => {
      const res1 = await app.inject({ method: 'GET', url: '/health' })
      const res2 = await app.inject({ method: 'GET', url: '/health' })
      const id1 = res1.json<{ requestId: string }>().requestId
      const id2 = res2.json<{ requestId: string }>().requestId
      expect(id1).not.toBe(id2)
    })
  })

  describe('GET /demo/info', () => {
    it('returns 200 with level info and requestId', async () => {
      const res = await app.inject({ method: 'GET', url: '/demo/info' })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ level: string; requestId: string }>()
      expect(body.level).toBe('info')
      expect(typeof body.requestId).toBe('string')
    })
  })

  describe('GET /demo/debug', () => {
    it('returns 200 with level debug and requestId', async () => {
      const res = await app.inject({ method: 'GET', url: '/demo/debug' })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ level: string; requestId: string }>()
      expect(body.level).toBe('debug')
    })
  })

  describe('GET /demo/warn', () => {
    it('returns 200 with level warn and requestId', async () => {
      const res = await app.inject({ method: 'GET', url: '/demo/warn' })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ level: string; requestId: string }>()
      expect(body.level).toBe('warn')
    })
  })

  describe('GET /demo/error', () => {
    it('returns 200 with level error and requestId', async () => {
      const res = await app.inject({ method: 'GET', url: '/demo/error' })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ level: string; requestId: string }>()
      expect(body.level).toBe('error')
    })
  })

  describe('LOG_LEVEL env var', () => {
    it('defaults to info when LOG_LEVEL is unset', () => {
      delete process.env.LOG_LEVEL
      const instance = buildApp()
      expect(instance.log.level).toBe('info')
      instance.close()
    })

    it('respects LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug'
      const instance = buildApp()
      expect(instance.log.level).toBe('debug')
      delete process.env.LOG_LEVEL
      instance.close()
    })

    it('respects LOG_LEVEL=warn', () => {
      process.env.LOG_LEVEL = 'warn'
      const instance = buildApp()
      expect(instance.log.level).toBe('warn')
      delete process.env.LOG_LEVEL
      instance.close()
    })

    it('respects LOG_LEVEL=error', () => {
      process.env.LOG_LEVEL = 'error'
      const instance = buildApp()
      expect(instance.log.level).toBe('error')
      delete process.env.LOG_LEVEL
      instance.close()
    })
  })
})
