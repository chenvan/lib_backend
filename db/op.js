const knex = require('./knex')
const bcrypt = require('bcrypt')

function search (info) {
  let op = Array.isArray(info) ? '&@~' : '&@'
  return knex.select(knex.raw('*, pgroonga_score(tableoid, ctid) AS score')).table('book')
    .whereRaw(
      `ARRAY[title, author] ${op} (:searchInfo, ARRAY[1, 1], :indexName)::pgroonga_full_text_search_condition`,
      {
        searchInfo: Array.isArray(info) ? info.join(' OR ') : info,
        indexName: 'pgroonga_title_and_author_index'
      }
  )
}

function verifyUser (uid, pwd) {
  return knex.select().table('user').where('uid', uid)
    .then(res => {
      if (res.length === 1) {
        let user = res[0]
        return bcrypt.compare(pwd, user.password)
          .then(isValid => {
            if (isValid) {
              return {
                uid: user.uid,
                name: user.name
              }
            } else {
              throw Error('密码错误')
            }
          })
      } else {
        throw Error(`不存在工号 ${uid}`)
      }
    })
}

function getUserInfo(tableName, uid) {
  return knex.select().table(tableName)
    .innerJoin('book', `${tableName}.bid`, 'book.bid')
    .where('uid', uid)
}


module.exports = {
  search,
  verifyUser,
  getUserInfo
}