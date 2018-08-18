const knex = require('../db/knex')
const https = require('https')
const fetch = require('node-fetch')

const testData = require('./test.data.json')

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

test('login with correct info', () => {
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: testData.uid, pwd: testData.pwd}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('token')
      expect(res).toHaveProperty('user')
    })
})

test('login with fake uid', () => {
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: testData.fakeUid, pwd: testData.pwd}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe(`不存在工号 ${testData.fakeUid}`)
    })
})

test('login with fake password', () => {
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: testData.uid, pwd: testData.fakePwd}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe(`密码错误`)
    })
})