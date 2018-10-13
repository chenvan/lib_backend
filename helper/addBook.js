const knex = require('../db/knex')
const path = require('path')

let bookData = require(path.relative(__dirname, process.argv[2]))
let promiseArray = []

for (let isbn in bookData) {
  // console.log(isbn)
  promiseArray.push(
    knex('book').insert({
      isbn,
      type: bookData[isbn].type,
      owner: bookData[isbn].owner,
      title: bookData[isbn].title,
      author: bookData[isbn].author,
      summary: bookData[isbn].summary,
      cover_url: bookData[isbn].coverUrl,
      total_number: bookData[isbn].number,
      now_number: bookData[isbn].number
    })
      .catch(err => {
        if (err.code === '23505') {
          console.log(`${isbn} : ${bookData[isbn].title} 已经存在`)
        } else {
          console.log('sql error: ', err)
        }
      })
  )
}

Promise.all(promiseArray)
  .then(() => {
    knex.destroy()
  })
  .catch(err => {
    console.log('promise_all error: ', err)
  })
    