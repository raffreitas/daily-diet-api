import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { knex } from '../database'
import { checkUserIdExists } from '../middlewares/check-user-id-exists'

export async function mealRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkUserIdExists)

  app.post('/', async (request, reply) => {
    const userId = request.cookies.userId

    const createMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      onDiet: z.boolean(),
      mealTime: z.string(),
    })

    const { description, name, onDiet } = createMealSchema.parse(request.body)

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      on_diet: onDiet,
      user_id: userId,
      meal_time: new Date().toISOString(),
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request) => {
    const userId = request.cookies.userId

    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const updateMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      onDiet: z.boolean(),
      mealTime: z.string(),
    })

    const { description, name, onDiet, mealTime } = updateMealSchema.parse(
      request.body,
    )

    const updatedMeal = await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .update({
        name,
        description,
        on_diet: onDiet,
        meal_time: mealTime,
      })
      .returning('*')

    return { meal: updatedMeal }
  })

  app.delete('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const userId = request.cookies.userId

    const { id } = getMealParamsSchema.parse(request.params)

    const mealExists = await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .select('*')
      .first()

    if (!mealExists) {
      return reply.status(404).send({ message: 'Não foi possível excluir' })
    }

    await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .delete()

    return reply.status(200).send()
  })

  app.get('/', async (request) => {
    const userId = request.cookies.userId

    const meals = await knex('meals').where('user_id', userId).select('*')

    return { meals }
  })

  app.get('/:id', async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const userId = request.cookies.userId

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
        user_id: userId,
      })
      .select('*')
      .first()

    return { meal }
  })

  app.get('/metrics', async (request) => {
    const userId = request.cookies.userId

    const registeredMeals = await knex('meals')
      .where('user_id', userId)
      .count('*', { as: 'registeredMeals' })
      .first()

    const onDietMeals = await knex('meals')
      .where({
        user_id: userId,
        on_diet: true,
      })
      .count('*', { as: 'onDietMeals' })
      .first()

    const offDietMeals = await knex('meals')
      .where({
        user_id: userId,
        on_diet: false,
      })
      .count('*', { as: 'offDietDiet' })
      .first()

    const mealList = await knex('meals')
      .where('user_id', userId)
      .select('id', 'on_diet')
      .orderBy('meal_time')

    const { bestSequence } = mealList.reduce(
      (prev, meal) => {
        return {
          sequence: meal.on_diet ? ++prev.sequence : 0,
          bestSequence: Math.max(prev.sequence, prev.bestSequence),
        }
      },
      {
        bestSequence: 0,
        sequence: 0,
      },
    )

    return {
      metrics: {
        ...registeredMeals,
        ...onDietMeals,
        ...offDietMeals,
        bestSequence,
      },
    }
  })
}
