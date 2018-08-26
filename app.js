const http = require('http')
const https = require('https')
const fs = require('fs')

const Koa = require('koa')
const Router = require('koa-router')
const enforceHttps = require('koa-sslify')
const bodyParser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const koaJwt = require('koa-jwt')

const db = require('./db/op')
const isAdmin = require('./helper/isAdmin')

const libSetting = require('./library.setting.json')

const app = new Koa()
const router = new Router({
  prefix: '/api'
})

app.use(enforceHttps())
app.use(bodyParser())

router
  .use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      // console.log('catch error:', err)
      let message = err.message
      ctx.status = 401
      ctx.body = {message}
    }
  })

router
  .get('/test/1', async ctx => {
    ctx.body = {
      message: 'hello world'
    }
  })

router
  .post('/login', async ctx => {
    let user = await db.verifyUser(ctx.request.body.uid, ctx.request.body.pwd)
    ctx.body = {
      user,
      token: jwt.sign({uid: user.uid, isAdmin: isAdmin(user.uid)}, libSetting.secret, {expiresIn: '1h'})
    }
  })

router.use(koaJwt({secret: libSetting.secret, key: 'jwtdata'}))

router
  .get('/test/2', async ctx => {
    ctx.body = {
      message: 'hello world'
    }
  })

router
  .get('/user/:info', async ctx => {
    ctx.body = {
      [ctx.params.info + 'List'] : await db.getUserInfo(ctx.params.info, ctx.state.jwtdata.uid)
    }
  })

router
  .get('/type', async ctx => {
    ctx.body = {
      typeList: await db.getTypeList()
    }
  })
  .post('/type', async ctx => {
    ctx.body = {
      resultList: await db.searchByType(ctx.request.body.type, ctx.request.body.lastBid, ctx.request.body.offset)
    }
  })

router
  .post('/search', async ctx => {
    ctx.body = {
      resultList: await db.search(ctx.request.body.info, ctx.request.body.offset)
    }
  })

router
  .post('/changepwd', async ctx => {
    await db.changepwd(ctx.state.jwtdata.uid, ctx.request.body.oldpwd, ctx.request.body.newpwd)
    ctx.body = {
      message: '密码修改成功'
    }
  })

router
  .post('/fav', async ctx => {
    ctx.body = {
      addList: await db.addToFav(ctx.state.jwtdata.uid, ctx.request.body.bid)
    }
  })
  .del('/fav', async ctx => {
    ctx.body = {
      deleteList: await db.deleteFromFav(ctx.state.jwtdata.uid, ctx.request.body.bidList)
    }
  })

router
  .post('/borrow', async ctx => {
    if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
    await db.borrowBook(ctx.request.body.uid, ctx.request.body.bid)
    ctx.body = {
      message: '借阅成功'
    }
  })

router
  .post('/return', async ctx => {
    if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
    await db.returnBook(ctx.request.body.uid, ctx.request.body.bid)
    ctx.body = {
      message: '还书成功'
    }
  })

router
  .get('/outdated', async ctx => {
    if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
    ctx.body = {
      outdatedList: await db.getOutdatedList()
    }
  })

app
  .use(router.routes())
  .use(router.allowedMethods())

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

