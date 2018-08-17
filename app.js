const http = require('http')
const https = require('https')
const fs = require('fs')

const Koa = require('koa')
const enforceHttps = require('koa-sslify')
const bodyParser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const koaJwt = require('koa-jwt')

const app = new Koa()

app.use(enforceHttps())
app.use(bodyParser())

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    let message = err.message
    ctx.status = 401
    ctx.body = {message}
  }
})

app.use(async (ctx, next) => {
  if (ctx.url.match(/^\/api\/test\/1/)) {
    ctx.body = {
      message: 'hello world'
    }
    ctx.status = 200
  } else {
    await next()
  }
})

app.use(async (ctx, next) => {
  if (ctx.url.match(/^\/api\/login/)) {
    // ctx.body = await op.checkUser()
    ctx.body = {
      token: jwt.sign({uid: '001960'}, 'changeit', {expiresIn: '10s'})
    }
    ctx.status = 200
  } else {
    await next()
  }
})

app.use(koaJwt({secret: 'changeit', key: 'jwtdata'}))

app.use(async (ctx, next) => {
  if (ctx.url.match(/^\/api\/test\/2/)) {
    console.log('jwt data:', ctx.state.jwtdata)
    ctx.body = {
      message: 'hello world'
    }
    ctx.status = 200
  } else {
    await next()
  }
})

const options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
  requestCert: false,
  rejectUnauthorized: false
}

http.createServer(app.callback()).listen(80, () => {
  console.log('running http server')
})

https.createServer(options, app.callback()).listen(443, () => {
  console.log('running https server')
})

