// Update with your config settings.
const knexSetting = require('./knex.setting.json')

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: '5432',
      database: knexSetting.development.database,
      user:     knexSetting.development.user,
      password: knexSetting.development.password
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: '5432',
      database: knexSetting.development.database,
      user:     knexSetting.development.user,
      password: knexSetting.development.password
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: '5432',
      database: knexSetting.production.database,
      user:     knexSetting.production.user,
      password: knexSetting.production.password
    }
  }

};
