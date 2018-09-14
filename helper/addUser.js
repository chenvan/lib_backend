const readline = require('readline')
const fs = require('fs')
const bcrypt = require('bcrypt')
const knex = require('../db/knex')

const salt_rounds = 10

let promiseArray = []

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2])
})

rl.on('line', line => {
  let [uid, name] = line.split(/\s+/)
  promiseArray.push(
    bcrypt.hash(uid, salt_rounds)
      .then(hash_pwd => {
        return knex('user').insert({
          uid,
          name,
          password: hash_pwd
        })
      })
      .catch(err => {
        if (err.code === '23505') {
          console.log(`${uid} : ${name} 已经存在`)
          return null
        } else {
          throw err
        }
      })
  )
})

rl.on('close', () => {
  Promise.all(promiseArray)
    .then(() => {
      knex.destroy()
    })
    .catch(err => {
      console.log('error: ', err)
    })
})

