const knex = require('./knex')

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

module.exports = {
  search
}