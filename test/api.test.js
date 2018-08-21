const knex = require('../db/knex')
const https = require('https')
const fetch = require('node-fetch')

const testData = require('./test.data.json')

jest.setTimeout(30000)

const agent = new https.Agent({
  rejectUnauthorized: false
})

let userToken 
let adminToken

beforeAll(() => {
  return knex.migrate.rollback()
    .then(() => knex.migrate.latest())
    .then(() => knex.seed.run())
    .then(() => {
      return Promise.all([
        fetch('https://localhost/api/login', {
          method: 'POST',
          body: JSON.stringify({uid: testData.uid, pwd: testData.pwd}),
          headers: {'Content-Type': 'application/json'},
          agent
        })
          .then(res => res.json()),
        fetch('https://localhost/api/login', {
          method: 'POST',
          body: JSON.stringify({uid: testData.adminUid, pwd: testData.adminPwd}),
          headers: {'Content-Type': 'application/json'},
          agent
        })
          .then(res => res.json())
      ])
    })
    .then(resList => {
      userToken = resList[0].token
      adminToken = resList[1].token
    })
})

afterAll(() => {
  return knex.migrate.rollback() 
    .then(() => knex.destroy())
    .then(() => console.log('disconnect db'))
})


describe('test general api', () => {
  test('get user favorite list', () => {
    return fetch('https://localhost/api/fav', {
      headers: {'Authorization': 'Bearer ' + userToken},
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
      headers: {'Authorization': 'Bearer ' + userToken},
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
      headers: {'Authorization': 'Bearer ' + userToken},
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
      headers: {'Authorization': 'Bearer ' + userToken},
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
        'Authorization': 'Bearer ' + userToken,
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
        'Authorization': 'Bearer ' + userToken,
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
    return knex.select('bid').from('book')
      .then(bidList => {
        return Promise.all(
          bidList.map(item => {
            return fetch('https://localhost/api/addtofav', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + userToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({bid: item.bid}),
              agent
            })
              .then(res => res.json())
          })
        )
      })
      .then(resList => {
        // 不重复收藏
        expect(
          resList.some(res => {
            return res.message === "已收藏"
          })
        ).toBeTruthy

        expect(
          resList.some(res => {
            return res.message === "添加成功"
          })
        ).toBeTruthy
      })
  })
  
  // should be last test because of change password? but old token maybe could continue
  test('change password', () => {
    return fetch('https://localhost/api/changepwd', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
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
})

describe('test admin api', () => {
  let borrowingBidList
  let noBorrowingBidList

  beforeAll(() => {
    return Promise.all([
      knex.select('bid').from('book'),
      knex.select('bid').from('borrowing')
    ])
    .then(resList => {
      console.log(resList)
      let bidList = resList[0]
      borrowingBidList = resList[1]
      // borrowingBidList has dupicated value
      noBorrowingBidList = bidList.filter(item => {
        return borrowingBidList.every( borrowingItem => borrowingItem.bid !== item.bid)
      })

      console.log(borrowingBidList, noBorrowingBidList)
    })
  })

  test('borrow book', () => {
    fetch('https://localhost/api/borrow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: borrowingBidList[0].bid}), // borrow the same book
      agent
    })
    .then(res => res.json())
    .then(res => {
      console.log(res)
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', borrowingBidList[0].bid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select().from('history').where('uid', testData.uid)
      ])
    })
    .then(resList => {
      console.log('book: ', resList[0])
      console.log('borrowing: ', resList[1])
      console.log('history: ', resList[2])
    })
  })
})