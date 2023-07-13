import { FastifyInstance } from 'fastify'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', (request, reply) => {
    return 'Hello World'
  })
}
