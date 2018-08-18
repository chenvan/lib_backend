const knex = require('../db/knex')
const https = require('https')
const fetch = require('node-fetch')

const testData = require('./test.data.json')

jest.setTimeout(30000)

const agent = new https.Agent({
  rejectUnauthorized: false
})

let token = ''

beforeAll(() => {
  return knex.migrate.rollback()
    .then(() => knex.migrate.latest())
    .then(() => knex.seed.run())
    .then(() => {
      return fetch('https://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({uid: testData.uid, pwd: testData.pwd}),
        headers: {'Content-Type': 'application/json'},
        agent
      })
        .then(res => res.json())
        .then(res => {
          token = res.token
        })
    })
})

afterAll(() => {
  return knex.migrate.rollback() 
    .then(() => knex.destroy())
    .then(() => console.log('disconnect db'))
})

test('get user favorite list', () => {
  return fetch('https://localhost/api/fav', {
    headers: {'Authorization': 'Bearer ' + token},
    agent
  })
   .then(res => res.json())
   .then(res => {
     expect(res).toHaveProperty('favList')
     expect(res.favList.length).toBeGreaterThan(0)
   })
})

test('get user history list', () => {
  return fetch('https://localhost/api/history', {
    headers: {'Authorization': 'Bearer ' + token},
    agent
  })
   .then(res => res.json())
   .then(res => {
     expect(res).toHaveProperty('historyList')
     expect(res.historyList.length).toBeGreaterThan(0)
   })
})

test('get user borrowing list', () => {
  return fetch('https://localhost/api/borrowing', {
    headers: {'Authorization': 'Bearer ' + token},
    agent
  })
   .then(res => res.json())
   .then(res => {
     expect(res).toHaveProperty('borrowingList')
     expect(res.borrowingList.length).toBeGreaterThan(0)
   })
})