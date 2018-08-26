
let userNumer  = 3000
let bookBorrowedNumber = userNumer * 2

// generate 3000 users
function genUsers (knex) {
  let result = []
  for (let uid = 1; uid <= userNumer; uid++) {
    result.push({
      uid: uid.toString(),
      name: uid.toString(),
      password: '000000',
      borrowing_number: 2
    })
  }
  return knex.batchInsert('user', result, userNumer)
}

// generate books, 6000 books are borrowed
// cause error when endNum - beginNum > 8000(?)
function genBooks (knex, beginNum, endNum) {
  let result = []
  for (let i = beginNum; i <= endNum; i++) {
    result.push({
      isbn:  i.toString(),
      title: i.toString(),
      author: i.toString(),
      cover_url: i.toString(),
      summary: i.toString(),
      type: (i % 20).toString(), //???
      total_number: 1,
      now_number: i <= bookBorrowedNumber ? 0 : 1
    })
  }
  return knex.batchInsert('book', result, endNum - beginNum + 1)
}

function genBorrowingRecord (knex) {
  return knex.select('bid').table('book').where('now_number', 0)
    .then(res => {
      let result = []
      res.forEach((item, index) => {
        result.push({
          uid: index % userNumer + 1,
          bid: item.bid
        })
      })
      return knex.batchInsert('borrowing', result, bookBorrowedNumber)
    })
}

function genHisRecord (knex) {
  let promiseArray = []
  for (let uid = 1; uid <= userNumer; uid++) {
    promiseArray.push(
      knex.select('bid').table('borrowing').where('uid', uid)
        .then(borrowingList => {
          let bidList = borrowingList.map(item => item.bid)
          return knex.select('bid').table('book').whereNotIn('bid', bidList).limit(98)
            .then(res => {
              let result = borrowingList.concat(res).map(item => {
                return {
                  uid: uid.toString(),
                  bid: item.bid
                }
              })
              return knex.batchInsert('history', result, 100)
            })
        })
    )
  }

  return Promise.all(promiseArray)
}

function genFavRecord (knex) {
  return knex.select('bid').table('book').limit(100)
    .then(res => {
      let promiseArray = []
      for (let uid = 1; uid <= userNumer; uid++) {
        let result = res.map(item => {
          return {
            uid: uid.toString(),
            bid: item.bid
          }
        })

        promiseArray.push(
          knex.batchInsert('fav', result, 100)
        )
      }
      return Promise.all(promiseArray)
    })
}

exports.seed = function(knex, Promise) {
  return Promise.resolve()
  .then(() => {
    console.log('deleting tables...')
    return Promise.all([
      knex('book').del(),
      knex('user').del(),
      knex('fav').del(),
      knex('history').del(),
      knex('borrowing').del()
    ]) 
  }) 
  .then(() => {
    console.log('deleted tables')
    console.log('creating user & book tables...')
    return Promise.all([
      genUsers(knex),
      genBooks(knex, 1, 5000),
      genBooks(knex, 5001, 10000)
    ])
  })
  .then(() => {
    console.log('created user & book tables')
    console.log('creating borrowing table...')
    return genBorrowingRecord(knex)
  })
  .then(() => {
    console.log('created borrowing table')
    console.log('creating fav table...')
    return genFavRecord(knex)
  })
  .then(() => {
    console.log('created fav table')
    console.log('creating history table...')
    return genHisRecord(knex)
  })
  .then(() => {
    console.log('created history table')
  })
}
