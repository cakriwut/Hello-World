import { FastifyInstance, FastifyPluginCallback } from 'fastify'

export const healthRoutes: FastifyPluginCallback = (
  app: FastifyInstance,
  _opts,
  done,
) => {
  app.get('/health', async (request, reply) => {
    request.log.info({ requestId: request.id }, 'health check')
    return reply.send({ status: 'ok', requestId: request.id })
  })

  done()
}
