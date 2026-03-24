import { FastifyInstance, FastifyPluginCallback } from 'fastify'

export const demoRoutes: FastifyPluginCallback = (
  app: FastifyInstance,
  _opts,
  done,
) => {
  app.get('/info', async (request, reply) => {
    request.log.info({ requestId: request.id }, 'info level demo')
    return reply.send({ level: 'info', requestId: request.id })
  })

  app.get('/debug', async (request, reply) => {
    request.log.debug({ requestId: request.id }, 'debug level demo')
    return reply.send({ level: 'debug', requestId: request.id })
  })

  app.get('/warn', async (request, reply) => {
    request.log.warn({ requestId: request.id }, 'warn level demo')
    return reply.send({ level: 'warn', requestId: request.id })
  })

  app.get('/error', async (request, reply) => {
    request.log.error({ requestId: request.id }, 'error level demo')
    return reply.send({ level: 'error', requestId: request.id })
  })

  done()
}
