
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('user', function(table) {
      table.string('uid').primary()
      table.string('name').notNullable()
      table.string('password').notNullable()
    }),

    knex.schema.createTable('book', function(table) {
      table.increments('bid')
      table.string('isbn')
      table.string('title').notNullable()
      table.string('author')
      table.text('cover_url')
      table.text('summary')
      table.integer('all_number').notNullable()
      table.integer('now_number').notNullable()

      // title, author should use index that help text search
    }),

    knex.schema.createTable('fav', function(table) {

    }),
    
    knex.schema.createTable('history', function(table) {

    }),

    knex.schema.createTable('borrowing', function(table) {

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('user'),
    knex.schema.dropTable('book'),
    knex.schema.dropTable('fav'),
    knex.schema.dropTable('history'),
    knex.schema.dropTable('borrowing'),
  ])
};
