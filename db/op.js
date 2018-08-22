const knex = require('./knex')
const bcrypt = require('bcrypt')

const salt_rounds = 10

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
    .orderBy('score', 'desc')
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

function getType() {
  return knex.select('type').table('book').groupBy('type')
}

function searchType (type, lastBid = -1) { 
  return knex.select().table('book')
    .where('type', type)
    .andWhere('bid', '>', lastBid)
    .orderBy('bid')
}

function changepwd (uid, oldpwd, newpwd) {
  return verifyUser(uid, oldpwd)
    .then(() => {
      return bcrypt.hash(newpwd, salt_rounds)
    })
    .then(hash_pwd => {
      return knex('user').where('uid', uid)
        .update('password', hash_pwd)
    })
}

function addToFav (uid, bid) {
  return knex('fav').insert({uid, bid})
    .catch(err => {
      if (err.message.includes('fav_uid_bid_unique')) {
        throw Error('已收藏')
      } else {
        throw err
      }
    })
}

function borrowBook (uid ,bid) {
  return knex.transaction(trx => {
    return Promise.all([
      trx
        .insert({uid, bid})
        .into('borrowing'),
      trx
        .where('bid', bid)
        .decrement('now_number', 1)
        .into('book'),
      trx
        .where('uid', uid)
        .increment('borrowing_number', 1)
        .into('user'),
      trx
        .insert({uid, bid})
        .into('history')
    ])
  })
    .catch(err => {
      if (err.message.includes('borrowing_uid_bid_unique')) {
        throw Error('重复借书')
      } else if(err.message.includes('valid_now_number_and_total_number')) {
        throw Error('本书已借完')
      } else if(err.message.includes('valid_borrowing_number')) {
        throw Error('借书量超过规定')
      }else {
        throw err
      }
    })
}


module.exports = {
  search,
  verifyUser,
  getUserInfo,
  getType,
  searchType,
  changepwd,
  addToFav,
  borrowBook
}