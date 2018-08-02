
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('user', function(table) {
      table.string('uid').primary()
      table.string('name').notNullable()
      table.string('password').notNullable()
    }),

    knex.schema.createTable('book', function(table) {
      table.increments('bid')
      // use to check if insert dupicate book
      table.string('isbn').unique()
      table.text('title').notNullable()
      table.text('author')
      table.text('cover_url')
      table.text('summary')
      // type column maybe should use enum
      table.string('type')
      table.integer('total_number').unsigned().notNullable()
      table.integer('now_number').unsigned().notNullable()
    
    })
      .raw('CREATE INDEX pgroonga_title_index ON book USING pgroonga (title)')
      .raw('CREATE INDEX pgroonga_author_index ON book USING pgroonga (author)')
      .raw('ALTER TABLE book ADD CONSTRAINT valid_now_number_check CHECK (total_number >= now_number)')
      ,

    knex.schema.createTable('fav', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user').onDelete('CASCADE')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book').onDelete('CASCADE')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    }),
    
    knex.schema.createTable('history', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user').onDelete('CASCADE')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book').onDelete('CASCADE')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    }),

    knex.schema.createTable('borrowing', function(table) {
      table.string('uid').notNullable().references('uid').inTable('user').onDelete('CASCADE')
      table.integer('bid').unsigned().notNullable().references('bid').inTable('book').onDelete('CASCADE')
      table.dateTime('add_time').notNullable().defaultTo(knex.raw('now()'))
      table.unique(['uid', 'bid'])
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists('fav'),
    knex.schema.dropTableIfExists('history'),
    knex.schema.dropTableIfExists('borrowing'),
    knex.schema.dropTableIfExists('user'),
    knex.schema.dropTableIfExists('book'),
  ])
};
