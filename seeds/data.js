const data = require('./data.json')

exports.seed = function(knex, Promise) {
  return knex('book').del() // Deletes ALL existing entries
    .then(function () {
      return Promise.all([ 
        knex('book').returning('bid').insert(data.book),
        knex('user').returning('uid').insert(data.user)
      ])
    })
    .then(([bidList, uidList]) => {
      let record = uidList.map(uid => {
        return {
          uid,
          bid: bidList[0]
        }
      })

      return Promise.all([
        knex('user').insert(data.admin), // insert admin user
        knex('fav').insert(record),
        knex('history').insert(record),
        knex('borrowing').insert(record)
      ])
    })
}
