const knex = require('../db/knex')
const fetch = require('node-fetch')

jest.setTimeout(30000)

beforeAll(() => {
  return knex.migrate.rollback()
    .then(() => knex.migrate.latest())
    .then(() => knex.seed.run())
})

afterAll(() => {
  return knex.migrate.rollback() 
    .then(() => knex.destroy())
    .then(() => console.log('disconnect db'))
})

test('visit protected link without token', () => {
  return fetch('http://localhost/api/test/2')
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('Authentication Error')
    })
})

test('visit protected link with token', () => {
  return fetch('http://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: '001960', pwd: '001960'}),
    headers: {'Content-Type': 'application/json'},
    // agent: agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('token')
      return res.token
    })
    .then(token => {
      return fetch('http://localhost/api/test/2',{
        headers: {'Authorization': 'Bearer ' + token}
      })
    })
    .then(res => res.json())
    .then(res =>{
      expect(res.message).toBe('hello world')
    })
})
