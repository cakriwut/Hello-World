import Fastify, { FastifyInstance } from 'fastify'
import { healthRoutes } from './routes/health.js'
import { demoRoutes } from './routes/demo.js'

export function buildApp(): FastifyInstance {
  const logLevel = process.env.LOG_LEVEL ?? 'info'

  const app = Fastify({
    logger: {
      level: logLevel,
      ...(process.env.LOG_PRETTY === 'true'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            },
          }
        : {}),
    },
    genReqId(req) {
      const upstream = req.headers['x-request-id']
      if (typeof upstream === 'string' && upstream.length > 0) {
        return upstream
      }
      return crypto.randomUUID()
    },
  })

  app.register(healthRoutes)
  app.register(demoRoutes, { prefix: '/demo' })

  return app
}
