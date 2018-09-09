const knex = require('./knex')
const bcrypt = require('bcrypt')

const salt_rounds = 10

function search (info, type, offset, limit = 30) {
  let op = Array.isArray(info) ? '&@~' : '&@'
  return knex.select(knex.raw('bid, title, author, cover_url, summary, book.type, pgroonga_score(tableoid, ctid) AS score')).table('book')
    .whereRaw(
      `ARRAY[title, author] ${op} (:searchInfo, ARRAY[1, 1], :indexName)::pgroonga_full_text_search_condition`,
      {
        searchInfo: Array.isArray(info) ? info.join(' OR ') : info,
        indexName: 'pgroonga_title_and_author_index'
      }
    )
    .where(builder => {
      if (type) {
        builder.where('type', type)
      }
    })
    .orderBy('score', 'desc')
    .limit(limit).offset(offset)
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

function getUserInfo(tableName, uid, limit = 50) {
  return knex.select('book.bid', 'title', 'author', 'cover_url', 'book.type', 'now_number')
    .table(tableName)
    .innerJoin('book', `${tableName}.bid`, 'book.bid')
    .where('uid', uid)
    .orderBy('add_time', 'desc')
    .limit(limit)
}

function getTypeList() {
  return knex.select('type').table('book').groupBy('type').orderBy('type')
}

function searchByType (type, lastBid, limit = 25) { 
  return knex.select('bid', 'title', 'author', 'cover_url', 'summary', 'book.type')
    .table('book')
    .where(builder => {
      if (type) {
        builder.where('type', type)
      }

      if (lastBid) {
        builder.andWhere('bid', '>', lastBid)
      }
    })
    .orderBy('bid')
    .limit(limit)
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
  return knex.transaction(trx => {
    return Promise.all([
      trx
        .insert({uid, bid})
        .into('fav'),
      trx
        .where('uid', uid)
        .increment('fav_number', 1)
        .into('user')
    ])
    .catch(err => {
      if (err.message.includes('fav_uid_bid_unique')) {
        return knex('fav').where('uid', uid).andWhere('bid', bid)
          .update({add_time: (new Date()).toISOString()}) // the add_time has time presicion lost problem
      } else if (err.message.includes('valid_fav_number')) {
        throw Error('收藏数超过上限')
      }  else {
        throw err
      }
    })
  })
}

function deleteFromFav(uid, bidList) {
  return knex.transaction(trx => {
      return trx
        .where('uid', uid).whereIn('bid', bidList)
        .del()
        .into('fav')
        .then(delNum => {
          return trx
            .where('uid', uid)
            .decrement('fav_number', delNum)
            .into('user')
        })
  })
  .catch(err => {
    if (err.message.includes(valid_fav_number)) {
      throw Error('收藏数量出现问题')
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

function returnBook(uid, bid) {
  return knex.transaction(trx => {
    return trx
      .where('uid', uid).andWhere('bid', bid)
      .del()
      .into('borrowing')
      .then(delNum => {
        return Promise.all([
          trx
            .where('bid', bid)
            .increment('now_number', delNum)
            .into('book'),
          trx
            .where('uid', uid)
            .decrement('borrowing_number', delNum)
            .into('user')
        ])
      })
  })
  .catch(err => {
    if (err.message.includes('valid_now_number_and_total_number')) {
      throw Error('书的库存出错')
    } else if (err.message.includes('valid_borrowing_number')) {
      throw Error('借书额度出错')
    } else {
      throw err
    }
  })
}

// book can be borrowed 15 days 
function getOutdatedList() {
  return knex('borrowing')
    .innerJoin('user', 'borrowing.uid', 'user.uid')
    .innerJoin('book', 'borrowing.bid', 'book.bid')
    .select('user.uid', 'user.name', 'title', 'author', 'cover_url', 'summary', 'book.type')
    .whereRaw('now() - borrowing.add_time > INTERVAL \'15 days\'')
    .orderBy('borrowing.uid')
}

function getBookInfo(bid) {
  return knex.select().table('book').where('bid', bid)
}

module.exports = {
  search,
  verifyUser,
  getUserInfo,
  getTypeList,
  searchByType,
  changepwd,
  addToFav,
  deleteFromFav,
  borrowBook,
  returnBook,
  getOutdatedList,
  getBookInfo,
}