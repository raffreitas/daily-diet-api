// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      email: string
      name: string
      created_at: string
    }
    meals: {
      id: string
      name: string
      description?: string
      meal_time: string
      created_at: string
      on_diet: boolean
      user_id: string
    }
  }
}
