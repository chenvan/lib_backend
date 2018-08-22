
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('user', function(table) {
      table.string('uid').primary()
      table.string('name').notNullable()
      table.string('password').notNullable()
      table.integer('borrowing_number').defaultTo(0)
    })
      // user 需要用双引号, 因为系统自带 user 表, 需要用双引号识别
      .raw('ALTER TABLE "user" ADD CONSTRAINT valid_borrowing_number CHECK (borrowing_number >= 0 AND borrowing_number <= 2)')
    ,

    knex.schema.createTable('book', function(table) {
      table.increments('bid')
      // use to check if insert dupicate book
      table.string('isbn').unique()
      table.text('title').notNullable()
      table.text('author')
      table.text('cover_url')
      table.text('summary')
      // type column maybe should use enum
      table.string('type').notNullable()
      table.integer('total_number').notNullable()
      table.integer('now_number').notNullable()
    
    })
      //.raw('CREATE INDEX pgroonga_title_index ON book USING pgroonga (title)')
      //.raw('CREATE INDEX pgroonga_author_index ON book USING pgroonga (author)')
      .raw('CREATE INDEX pgroonga_title_and_author_index ON book USING pgroonga ((ARRAY[title, author]))')
      .raw('ALTER TABLE book ADD CONSTRAINT valid_now_number_and_total_number CHECK (total_number >= now_number AND now_number >= 0 )')
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
      // table.unique(['uid', 'bid'])
      // how to avoid duplicate the record in the same time??
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
