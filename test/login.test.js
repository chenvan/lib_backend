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

test('login with correct info', () => {
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
    })
})

test('login with fake uid', () => {
  let fakeUid = '000000'
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: fakeUid, pwd: '001960'}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe(`不存在工号 ${fakeUid}`)
    })
})

test('login with fake password', () => {
  return fetch('https://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify({uid: '001960', pwd: '000000'}),
    headers: {'Content-Type': 'application/json'},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe(`密码错误`)
    })
})