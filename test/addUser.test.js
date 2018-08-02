const knex_config = require('../knexfile')['development']
const knex = require('knex')(knex_config)

jest.setTimeout(30000)

beforeAll(() => {
  // maybe should delete all user table's data
  return knex.migrate.rollback()
    .then(() => knex.migrate.latest())
})

afterAll(() => {
  return knex.destroy()
    .then(() => console.log('disconnect db'))
})

test('try', () => {
  expect(1).toBe(1)
})