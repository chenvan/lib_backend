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
    return fetch('https://localhost/api/user/fav', {
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
    return fetch('https://localhost/api/user/history', {
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
    return fetch('https://localhost/api/user/borrowing', {
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

  test('search book by type', () => {
    return fetch('https://localhost/api/type', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({type: '小说', lastBid: 0}),
      agent
    })
      .then(res => res.json())
      .then(res => {
        expect(res).toHaveProperty('resultList')
        expect(res.resultList.length).toBeGreaterThan(0)
      })
  })
  
  test('search book by info', () => {
    return fetch('https://localhost/api/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({info: ['紫金陈', '无证之罪'], offset: 0}),
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
            return fetch('https://localhost/api/fav', {
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
        //console.log(resList)
        expect(
          resList.every(res => {
            return res.message && res.message === "收藏成功"
          })
        ).toBeTruthy

        return knex.select('fav_number').from('user').where('uid', testData.uid)
      })
      .then(res => {
        expect(res[0].fav_number).toBe(5)
      })
  })

  test('delete book from fav', () => {
    return knex.select('bid', 'uid').from('fav').where('uid', testData.uid)
      .then(bidList => {
        return fetch('https://localhost/api/fav', {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + userToken,
            'Content-Type': 'application/json'
          },
          // bidList change to an array contain bid, not an object which has property bid
          body: JSON.stringify({bidList: bidList.map(item => item.bid)}), 
          agent
        })
      })
      .then(res => res.json())
      .then(res => {
        expect(res.message).toBe('删除成功')
        return Promise.all([
          knex('fav').count().where('uid', testData.uid),
          knex.select('fav_number').from('user').where('uid', testData.uid)
        ])
      })
      .then(resList => {
        expect(resList[0][0].count).toBe('0')
        expect(resList[1][0].fav_number).toBe(0)
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
  let canBeBorrowedBidList
  let borrowingBidListBySelf
  let borrowingBidListByOthers

  beforeAll(() => {
    return Promise.all([
      knex.select('bid').from('book').where('now_number', '>', '0'),
      knex.select('bid').from('borrowing').where('uid', testData.uid),
      knex.select('bid').from('borrowing').whereNot('uid', testData.uid)
    ])
    .then(resList => {
      // 有库存的书
      canBeBorrowedBidList = resList[0]
      // 自己借的书
      borrowingBidListBySelf = resList[1]
      // 别人借的书, 即 now_number = 0 的书
      borrowingBidListByOthers = resList[2]
      
      // console.log('borrowing bid list by self: ', borrowingBidListBySelf)
      // console.log('borrowing bid list by others: ', borrowingBidListByOthers)
      // console.log('cab be borrowed bid list: ', canBeBorrowedBidList)
    })
  })

  test('borrow the book which is borrowing by self', () => {
    return fetch('https://localhost/api/borrow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: borrowingBidListBySelf[0].bid}), // borrow the same book
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('重复借书')
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', borrowingBidListBySelf[0].bid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select().from('history').where('uid', testData.uid)
      ])
    })
    .then(([[book], borrowingList, historyList]) => {
      expect(book.now_number).toBe(0)
      expect(borrowingList.length).toBe(1)
      expect(historyList.length).toBe(1)
    })
  })

  test('borrowing book which now number is zero', () => {
    return fetch('https://localhost/api/borrow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: borrowingBidListByOthers[0].bid}),
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('本书已借完')
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', borrowingBidListByOthers[0].bid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select().from('history').where('uid', testData.uid)
      ])
    })
    .then(([[book], borrowingList, historyList]) => {
      expect(book.now_number).toBe(0)
      expect(borrowingList.length).toBe(1)
      expect(historyList.length).toBe(1)
    })
  })

  test('borrowing book', () => {
    return fetch('https://localhost/api/borrow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: canBeBorrowedBidList[0].bid}),
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('借阅成功')
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', canBeBorrowedBidList[0].bid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select().from('history').where('uid', testData.uid)
      ])
    })
    .then(([[book], borrowingList, historyList]) => {
      expect(book.now_number).toBe(0)
      expect(borrowingList.length).toBe(2)
      expect(historyList.length).toBe(2)
    })
  })

  test('borrow another book(over the borrowing number limit)', () => {
    return fetch('https://localhost/api/borrow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: canBeBorrowedBidList[1].bid}),
      agent
    })
    .then(res => res.json())
    .then(res => {
      // expect(res.message).toBe('借书量超过规定')
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', canBeBorrowedBidList[1].bid),
        knex.select('borrowing_number').from('user').where('uid', testData.uid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select().from('history').where('uid', testData.uid)
      ])
    })
    .then(([[book], userList, borrowingList, historyList]) => {
      // console.log(book, userList, borrowingList, historyList)
      
      expect(book.now_number).toBe(1)
      expect(borrowingList.length).toBe(2)
      expect(historyList.length).toBe(2)
    })
  })

  test('return book that not borrow', () => {
    return fetch('https://localhost/api/return', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: canBeBorrowedBidList[1].bid}),
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('还书成功') // 改变了之前提示的 没有借这本书
      return knex.select().from('borrowing').where('uid', testData.uid)
    })
    .then(borrowingList => {
      expect(borrowingList.length).toBe(2)
    })
  })

  test('return book', () => {
    return fetch('https://localhost/api/return', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({uid: testData.uid, bid: canBeBorrowedBidList[0].bid}),
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res.message).toBe('还书成功')
      return Promise.all([
        knex.select('total_number', 'now_number').from('book').where('bid', canBeBorrowedBidList[0].bid),
        knex.select().from('borrowing').where('uid', testData.uid),
        knex.select('borrowing_number').from('user').where('uid', testData.uid)
      ])
    })
    .then(([[book], borrowingList, [user]]) => {
      expect(book.now_number).toBe(1)
      expect(borrowingList.length).toBe(1)
      expect(user.borrowing_number).toBe(1)
    })
  })

  test('return outdated list', () => {
    return fetch('https://localhost/api/outdated', {
      headers: {'Authorization': 'Bearer ' + adminToken},
      agent
    })
    .then(res => res.json())
    .then(res => {
      expect(res).toHaveProperty('outdatedList')
      expect(res.outdatedList.length).toBeGreaterThan(0)
    })
  })
})