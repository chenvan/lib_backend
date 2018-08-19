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

test('get book type', () => {
  return fetch('https://localhost/api/type', {
    headers: {'Authorization': 'Bearer ' + token},
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('typeList')
      expect(res.typeList.length).toBeGreaterThan(0)
    })
})

test('search book by info', () => {
  return fetch('https://localhost/api/search', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({info: ['紫金陈', '无证之罪']}),
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('resultList')
      expect(res.resultList.length).toBeGreaterThan(0)
    })
})

test('search book by type', () => {
  return fetch('https://localhost/api/searchtype', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({type: '小说'}),
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('resultList')
      expect(res.resultList.length).toBeGreaterThan(0)
    })
})

test('add book to fav', () => {
  // add book which already add to fav
  return knex.select('bid').from('fav').where('uid', testData.uid)
    .then(res => {
      let bid = res[0].bid
      return fetch('https://localhost/api/addtofav', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({bid}),
        agent
      })
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('已收藏')
    })
})


// should be last test because of change password? but old token maybe could continue
test('change password', () => {
  return fetch('https://localhost/api/changepwd', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({oldpwd: testData.pwd, newpwd: testData.changePwd}),
    agent
  })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('密码修改成功')
      // use old password to login
      return fetch('https://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({uid: testData.uid, pwd: testData.pwd}),
        headers: {'Content-Type': 'application/json'},
        agent
      })
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('密码错误')
      // use new password to login
      return fetch('https://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({uid: testData.uid, pwd: testData.changePwd}),
        headers: {'Content-Type': 'application/json'},
        agent
      })
    })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('token')
      expect(res).toHaveProperty('user')
    })
})