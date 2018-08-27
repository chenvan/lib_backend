
let userNumer  = 3000
let bookBorrowedNumber = userNumer * 2
let titleList = [
  'SQL必知必会',
  'The Practice of Programming',
  '零秒工作',
  'Algorithms',
  '心的处方笺',
  'Linux Pocket Guide: Essential Commands',
  'Grokking Algorithms',
  '鸟哥的Linux私房菜',
]
let authorList = [
  '福达',
  'Brian W. Kernighan / Rob Pike',
  '赤羽雄二',
  'Robert Sedgewick / Kevin Wayne',
  '河合隼雄',
  'Daniel J. Barrett',
  'Aditya Bhargava',
  '鸟哥',
]
let summaryList = [
  '本书是深受世界各地读者欢迎的SQL经典畅销书，内容丰富，文字简洁明快，针对Oracle、SQL Server、MySQL、DB2、PostgreSQL、SQLite等各种主流数据库提供了大量简明的实例。与其他同类图书不同，它没有过多阐述数据库基础理论，而是专门针对一线软件开发人员，直接从SQL SELECT开始，讲述实际工作环境中最常用和最必需的SQL知识，实用性极强。通过本书，读者能够从没有多少SQL经验的新手，迅速编写出世界级的SQL！',
  'With the same insight and authority that made their book The Unix Programming Environment a classic, Brian Kernighan and Rob Pike have written The Practice of Programming to help make individual programmers more effective and productive',
  '像麦肯锡精英一样\n将工作速度和工作效率提升到极致',
  'Essential Information about Algorithms and Data Structures A Classic Reference The latest version of Sedgewick,s best-selling series, reflecting an indispensable body of knowledge developed over the past several decades. Broad Coverage Full treatment of data structures and algorithms for sorting, searching, graph processing, and string processing, including fifty algorithms every programmer should know.',
  '每一个看似常识性的问题，河合隼雄先生都给出了颠覆常人惯性思考模式的另一种答案。每一句诙谐幽默的语言里，都蕴含着充满智慧的独到见解。这一次，这位极富盛名的一代心理大师将带领你一起，唤醒沉睡多年的心灵，聆听迷失良久的心声，寻回灵魂最深处的感动。',
  'If you use Linux in your day-to-day work, this popular pocket guide is the perfect on-the-job reference. The third edition features new commands for processing image files and audio files, running and killing programs, reading and modifying the system clipboard, and manipulating PDF files, as well as other commands requested by readers.',
  '',
  '本书是最具知名度的Linux入门书《鸟哥的Linux私房菜基础学习篇》的最新版，全面而详细地介绍了Linux操作系统',
]

let titleListLength = titleList.length
let authorListLength = authorList.length
let summaryListLength = summaryList.length

let date = new Date()
let dateListLength = 30
let dateList = []
for (let i = 0; i < dateListLength; i++) {
  date.setDate(date.getDate() - 1)
  dateList.push(date.toISOString())
}

function genUsers (knex) {
  let result = []
  for (let uid = 1; uid <= userNumer; uid++) {
    result.push({
      uid: uid.toString(),
      name: uid.toString(),
      password: '000000',
      borrowing_number: 2
    })
  }
  return knex.batchInsert('user', result, userNumer)
}

// cause error when endNum - beginNum > 8000(not check accurately)
function genBooks (knex, beginNum, endNum) {
  let result = []
  for (let i = beginNum; i <= endNum; i++) {
    result.push({
      isbn:  i.toString(),
      title: titleList[i % titleListLength],
      author: authorList[i % authorListLength],
      cover_url: i.toString(),
      summary: summaryList[i % summaryListLength],
      type: (i % 20).toString(), 
      total_number: 1,
      now_number: i <= bookBorrowedNumber ? 0 : 1
    })
  }
  return knex.batchInsert('book', result, endNum - beginNum + 1)
}

function genBorrowingRecord (knex) {
  return knex.select('bid').table('book').where('now_number', 0)
    .then(res => {
      let result = []
      res.forEach((item, index) => {
        result.push({
          uid: index % userNumer + 1,
          bid: item.bid,
          add_time: dateList[index % dateListLength]
        })
      })
      return knex.batchInsert('borrowing', result, bookBorrowedNumber)
    })
}

function genHisRecord (knex) {
  let promiseArray = []
  for (let uid = 1; uid <= userNumer; uid++) {
    promiseArray.push(
      knex.select('bid').table('borrowing').where('uid', uid)
        .then(borrowingList => {
          let bidList = borrowingList.map(item => item.bid)
          return knex.select('bid').table('book').whereNotIn('bid', bidList).limit(98)
            .then(res => {
              let result = borrowingList.concat(res).map((item, index) => {
                return {
                  uid: uid.toString(),
                  bid: item.bid,
                  add_time: dateList[index % dateListLength]
                }
              })
              return knex.batchInsert('history', result, 100)
            })
        })
    )
  }

  return Promise.all(promiseArray)
}

function genFavRecord (knex) {
  return knex.select('bid').table('book').limit(100)
    .then(res => {
      let promiseArray = []
      for (let uid = 1; uid <= userNumer; uid++) {
        let result = res.map((item, index) => {
          return {
            uid: uid.toString(),
            bid: item.bid,
            add_time: dateList[index % dateListLength]
          }
        })

        promiseArray.push(
          knex.batchInsert('fav', result, 100)
        )
      }
      return Promise.all(promiseArray)
    })
}

exports.seed = function(knex, Promise) {
  return Promise.resolve()
  .then(() => {
    console.log('deleting tables...')
    return Promise.all([
      knex('book').del(),
      knex('user').del(),
      knex('fav').del(),
      knex('history').del(),
      knex('borrowing').del()
    ]) 
  }) 
  .then(() => {
    console.log('deleted tables')
    console.log('creating user & book tables...')
    return Promise.all([
      genUsers(knex),
      genBooks(knex, 1, 5000),
      genBooks(knex, 5001, 10000)
    ])
  })
  .then(() => {
    console.log('created user & book tables')
    console.log('creating borrowing table...')
    return genBorrowingRecord(knex)
  })
  .then(() => {
    console.log('created borrowing table')
    console.log('creating fav table...')
    return genFavRecord(knex)
  })
  .then(() => {
    console.log('created fav table')
    console.log('creating history table...')
    return genHisRecord(knex)
  })
  .then(() => {
    console.log('created history table')
  })
}
