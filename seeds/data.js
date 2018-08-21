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
      let borrowingBookBid = bidList[0]

      let record = uidList.map(uid => {
        return {
          uid,
          bid: borrowingBookBid
        }
      })

      return Promise.all([
        knex('user').insert(data.admin), // insert admin user
        knex('fav').insert(record),
        knex('history').insert(record),
        knex('book').where('bid', borrowingBookBid).decrement('now_number', 1),
        knex('borrowing').insert(record)
      ])
    })
}
