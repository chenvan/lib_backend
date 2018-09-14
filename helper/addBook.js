/*
input a txt file which contains some book infomation and get more info from douban

the txt file should contains isbn, book title, type of book, number of book. And use ";" separate above info

we use isbn to get info from douban, and use book title to check if the info is what we want.

*/

const readline = require('readline')
const fs = require('fs')
const fetch = require('node-fetch')
const similary = require('string-similarity')
const knex = require('../db/knex')

const doubanAPI = 'https://api.douban.com/v2/book/isbn'

let promiseArray = []

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2])
})

rl.on('line', line => {
  // console.log(line.split(/\s+/))
  let [isbn, title, type, num, owner] = line.split(/\s+/)
 
  promiseArray.push(
    fetch(`${doubanAPI}/${isbn}`)
      .then(res => res.json())
      .then(info => {
        // check title
        // includes is case sensitive and actually not 100% fit our case  
        // console.log('info: ', info)
        let rate = similary.compareTwoStrings(title, info.title)
        // console.log(rate)
        if (rate > 0.7) {
          // get the info we need
          // title, author, cover image url, summary
          // let result = {
          //   isbn,
          //   type,
          //   owner: owner || null,
          //   title: info.title,
          //   author: info.author.map(author => author.replace(/\s+/g, '')).join(', '), //info.author is an array
          //   summary: info.summary,
          //   cover_url: info.images.small,
          //   total_number: num,
          //   now_number: num
          // }
          // console.log(result)
    
          return knex('book').insert({
            isbn,
            type,
            owner: owner || null,
            title: info.title,
            author: info.author.map(author => author.replace(/\s+/g, '')).join(', '), //info.author is an array
            summary: info.summary,
            cover_url: info.images.small,
            total_number: num,
            now_number: num
          })
          .catch(err => {
            if (err.code === '23505') {
              console.log(`${isbn} : ${info.title} 已经存在`)
            } else {
              console.log('sql error: ', err)
            }
          })

        } else {
          console.log(`error: 从豆瓣得到的书名是${info.title}, 不符合输入的书名${title}`)
        }
      })
      .catch(err => console.log('fetch error: ', err))
    )
})

rl.on('close', () => {
  Promise.all(promiseArray)
    .then(() => {
      knex.destroy()
    })
    .catch(err => {
      console.log('promise_all error: ', err)
    })
})
