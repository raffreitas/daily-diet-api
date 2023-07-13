import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserSchema = z.object({
      name: z.string().nonempty(),
      email: z.string().nonempty(),
    })

    const { name, email } = createUserSchema.parse(request.body)

    const userAlreadyExists = await knex('users')
      .where('email', email)
      .select('*')
      .first()

    if (userAlreadyExists) {
      return reply.status(400).send({
        error: 'Já existe um usuário com esse email',
      })
    }

    const [user] = await knex('users')
      .insert({
        id: randomUUID(),
        email,
        name,
      })
      .returning('*')

    reply.setCookie('userId', user.id, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    return reply.status(201).send()
  })
}
