
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('user', function(table) {
      table.string('uid').primary()
      table.string('name').notNullable()
      table.string('password').notNullable()
    }),

    knex.schema.createTable('book', function(table) {
      table.increments('bid')
      // table.string('isbn')
      table.text('title').notNullable()
      table.text('author')
      table.text('cover_url')
      table.text('summary')
      // type column maybe should use enum
      table.string('type')
      table.integer('all_number').unsigned().notNullable()
      table.integer('now_number').unsigned().notNullable()
    })
      .raw('CREATE INDEX pgroonga_title_index ON book USING pgroonga (title)')
      .raw('CREATE INDEX pgroonga_author_index ON book USING pgroonga (author)')
      ,

    knex.schema.createTable('fav', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    }),
    
    knex.schema.createTable('history', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    }),

    knex.schema.createTable('borrowing', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('fav'),
    knex.schema.dropTable('history'),
    knex.schema.dropTable('borrowing'),
    knex.schema.dropTable('user'),
    knex.schema.dropTable('book'),
  ])
};
