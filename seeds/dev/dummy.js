// generate 3000 users
function genUsers () {
  let result = []
  for (let i = 0; i <= 3000; i++) {
    result.push({
      uid: i.toString(),
      name: i.toString(),
      password: '000000',
      borrowing_number: 2
    })
  }
  return result
}

// generate 8000 books, 6000 books are borrowed
function genBooks () {
  let result = []
  for (let i = 1; i <= 8000; i++) {
    result.push({
      isbn:  i.toString(),
      title: i.toString(),
      author: i.toString(),
      cover_url: i.toString(),
      summary: i.toString(),
      type: (i % 20).toString(), //???
      total_number: 1,
      now_number: i <= 6000 ? 0 : 1
    })
  }
  return result
}

function genBorrowingRecord (knex) {
  return knex.select('bid').table('book').where('now_number', 0)
    .then(res => {
      // should be 6000 items
      // console.log('res length:', res.length)
      let result = []
      res.forEach((item, index) => {
        result.push({
          uid: index % 3000 + 1,
          bid: item.bid
        })
      })
      return result
    })
}

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('book').del(),
    knex('user').del(),
    knex('fav').del(),
    knex('history').del(),
    knex('borrowing').del()
  ]) 
  .then(() => Promise.all([
    knex.batchInsert('user', genUsers(), 3000),
    knex.batchInsert('book', genBooks(), 8000),
  ]))
  .then(() => genBorrowingRecord(knex)
    .then(record => knex.batchInsert('borrowing', record, 6000))
  )
}
