const knex = require('../db/knex')
const https = require('https')
const fetch = require('node-fetch')

jest.setTimeout(30000)

const agent = new https.Agent({
  rejectUnauthorized: false
})

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
  return fetch('https://localhost/api/test/2', {agent})
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('Authentication Error')
    })
})

test('visit protected link with token', () => {
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: '001960', pwd: '001960'}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('token')
      expect(res).toHaveProperty('user')
      return res.token
    })
    .then(token => {
      return fetch('https://localhost/api/test/2',{
        headers: {'Authorization': 'Bearer ' + token},
        agent
      })
    })
    .then(res => res.json())
    .then(res =>{
      expect(res.message).toBe('hello world')
    })

    // check token invalid
})
