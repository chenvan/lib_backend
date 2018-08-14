const knex = require('../db/knex')
const db = require('../db/op')

jest.setTimeout(30000)

beforeAll(() => {
  return knex.migrate.rollback()
    .then(() => knex.migrate.latest())
    .then(() => knex.seed.run())
})

afterAll(() => {
  return knex.migrate.rollback() 
    .then(() => knex.destroy())
    .then(() => console.log('disconnect db'))
})


test('test pgroonga => search 小嶋陽菜', () => {
  return db.search('小嶋陽菜')
    .then(res => {
      expect(res.length).toBe(1)
      expect(res[0].title).toBe('小嶋陽菜1stフォトブック こじはる')
      expect(res[0].score).toBeGreaterThan(0)
    })
})

test('test pgroonga => search 紫金陈 OR 无证之罪', () => {
  return db.search(['紫金陈', '无证之罪'])
    .then(res => {
      // console.log(res)
      expect(res.length).toBe(1)
      expect(res[0].title).toBe('无证之罪')
      expect(res[0].score).toBeGreaterThan(0)
    })
})
