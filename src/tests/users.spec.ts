import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'

import { app } from '../app'

describe('Users E2E', () => {
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

  it('Should be able to create an user', async () => {
    await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)
  })
})
