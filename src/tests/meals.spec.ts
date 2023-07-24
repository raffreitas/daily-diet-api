import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../app'

describe('Meals E2E', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('Should be able to register a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookie)
      .send({
        name: 'Cookie',
        description: 'A Cookie',
        onDiet: false,
        mealTime: new Date().toISOString(),
      })
      .expect(201)
  })

  it('Should be able to list all meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Cookie',
      description: 'A salad',
      onDiet: false,
      mealTime: new Date().toISOString(),
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Salad',
      description: 'A salad',
      onDiet: true,
      mealTime: new Date().toISOString(),
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    expect(listMealsResponse.body.meals).toHaveLength(2)
    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Cookie',
        on_diet: 0,
      }),
      expect.objectContaining({
        name: 'Salad',
        on_diet: 1,
      }),
    ])
  })

  it('Should be able to list a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Cookie',
      description: 'A cookie',
      onDiet: false,
      mealTime: new Date().toISOString(),
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    const id = listMealsResponse.body.meals[0].id

    const listSpecificMealResponse = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', cookie)
      .send()

    expect(listSpecificMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Cookie',
        on_diet: 0,
      }),
    )
  })

  it('Should be able to update a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Cookie',
      description: 'A cookie',
      onDiet: false,
      mealTime: new Date().toISOString(),
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    const id = listMealsResponse.body.meals[0].id

    const updatedMealResponse = await request(app.server)
      .put(`/meals/${id}`)
      .set('Cookie', cookie)
      .send({
        name: 'Cookie',
        description: 'The best cookie',
        onDiet: false,
        mealTime: new Date().toISOString(),
      })

    expect(updatedMealResponse.body.meal).toEqual([
      expect.objectContaining({
        name: 'Cookie',
        description: 'The best cookie',
      }),
    ])
  })

  it('Should be able to delete a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Cookie',
      description: 'A cookie',
      onDiet: false,
      mealTime: new Date().toISOString(),
    })

    await request(app.server).post('/meals').set('Cookie', cookie).send({
      name: 'Salad',
      description: 'A Salad',
      onDiet: true,
      mealTime: new Date().toISOString(),
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    const id = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${id}`)
      .set('Cookie', cookie)
      .send()

    const updatedListMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .send()

    expect(updatedListMealsResponse.body.meals).toHaveLength(1)
    expect(updatedListMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Salad',
      }),
    ])
  })

  it('Should be able to get metrics of an user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })

    const cookie = createUserResponse.get('Set-Cookie')

    for (let i = 0; i < 10; i++) {
      const onDiet = !!(i >= 4 && i < 7)
      await request(app.server)
        .post('/meals')
        .set('Cookie', cookie)
        .send({
          name: `meal-${i}`,
          description: `meal${i}-description`,
          onDiet,
          mealTime: new Date().toISOString(),
        })
    }

    const userMetrics = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookie)
      .send()

    expect(userMetrics.body.metrics).toEqual(
      expect.objectContaining({
        registeredMeals: 10,
        onDietMeals: 3,
        offDietDiet: 7,
        bestSequence: 3,
      }),
    )
  })
})
