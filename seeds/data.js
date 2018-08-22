const data = require('./data.json')

exports.seed = function(knex, Promise) {
  return Promise.all([
      knex('book').del(),
      knex('user').del(),
      knex('fav').del(),
      knex('history').del(),
      knex('borrowing').del()
    ]) 
    .then(function () {
      return Promise.all([ 
        knex('book').returning('bid').insert(data.book),
        knex('user').returning('uid').insert(data.user)
      ])
    })
    .then(([bidList, uidList]) => {
      // the number of data.book > the number of data.user
      let borrowingBookBidList = []
      let record = uidList.map((uid, index) => {
        borrowingBookBidList.push(bidList[index])
        return {
          uid,
          bid: bidList[index]
        }
      })

      return Promise.all([
        knex('user').insert(data.admin), // insert admin user
        knex('fav').insert(record),
        knex('history').insert(record),
        knex('borrowing').insert(record)
      ])
        .then(() => {
          return Promise.all(
            borrowingBookBidList.map(bid => {
              return knex('book').where('bid', bid).decrement('now_number', 1)
            })
          )
        })
        .then(() => {
          return Promise.all(
            uidList.map(uid => {
              return knex('user').where('uid', uid).increment('borrowing_number', 1)
            })
          )
        })
    })
}
