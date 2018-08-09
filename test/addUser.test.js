const knex = require('../db/knex')

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