/*
input a txt file which contains some book infomation and get more info from douban

the txt file should contains isbn, book title, number of book. And use ";" separate above info

we use isbn to get info from douban, and use book title to check if the info is what we want.

*/

const readline = require('readline')
const fs = require('fs')
const fetch = require('node-fetch')

const doubanAPI = 'https://api.douban.com/v2/book/isbn'

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2]) 
})

// creat an output txt file
// 'wx' - Like 'w' but fails if the path exists.
// figure a better solution later
const output = fs.createWriteStream('./output.txt', {flags: 'w'})

rl.on('line', line => {
  // console.log('line from file: ', line)

  let [isbn, title, num] = line.split(/\s*;\s*/)
  
  // we should check isbn and num, we would complete it later
  // console.log(isbn, title, num)

  fetch(`${doubanAPI}/${isbn}`)
    .then(res => res.json())
    .then(info => {
      // check title
      // includes is case sensitive and actually not 100% fit our case  
      // console.log('info: ', info)
      if (info.title.includes(title)) {
        // get the info we need
        // title, author, cover image url, summary
        // and add isbn and number we have already provided
        let bookDetail = [
          isbn, // isbn
          info.title, // title
          info.author.join(', '), // author. info.author is array
          // maybe should check if there is no images or small property
          info.images.small, // cover image
          info.summary, // summary
          num // book number
        ]

        //console.log(bookDetail)
        // write info to file, later we would change to write to datebase
        output.write(`${bookDetail.join('; ')}\n\n\n`)
      } else {
        console.log(`error: 从豆瓣得到的书名是${info.title}, 不符合输入的书名${title}`)
      }
    })
    .catch(err => console.log('err: ', err))
})
