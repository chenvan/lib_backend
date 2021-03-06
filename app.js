const http = require('http')
const https = require('https')
const fs = require('fs')

const Koa = require('koa')
const Router = require('koa-router')
const enforceHttps = require('koa-sslify')
const bodyParser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const koaJwt = require('koa-jwt')
const serve = require('koa-static')

const db = require('./db/op')
const isAdmin = require('./helper/isAdmin')

const libSetting = require('./library.setting.json')

const app = new Koa()
const router = new Router({
  prefix: '/api'
})

app.use(enforceHttps())
app.use(bodyParser())
app.use(serve('./validation', {hidden: true}))

router
  .use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      // console.log('catch error:', err)
      let message = err.message
      ctx.status = 400
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
      uid: user.uid,
      name: user.name,
      isAdmin: isAdmin(user.uid),
      token: jwt.sign({uid: user.uid, isAdmin: isAdmin(user.uid)}, libSetting.secret, {expiresIn: '3d'})
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
      resultList: await db.searchByType(ctx.request.body.type, ctx.request.body.lastBid)
    }
  })

router
  .get('/book/:bid', async ctx => {
    ctx.body = {
      bookInfo: await db.getBookInfo(ctx.params.bid)
    }
  })

router
  .post('/search', async ctx => {
    ctx.body = {
      resultList: await db.search(ctx.request.body.info, ctx.request.body.type, ctx.request.body.offset)
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
    await db.addToFav(ctx.state.jwtdata.uid, ctx.request.body.bid)
    ctx.body = {
      message: '添加成功' 
    }
  })
  .del('/fav', async ctx => {
    await db.deleteFromFav(ctx.state.jwtdata.uid, ctx.request.body.bidList)
    ctx.body = {
      message: '删除成功'  
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
  .post('/outdated', async ctx => {
    if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
    ctx.body = {
      outdatedList: await db.getOutdatedList(ctx.request.body.days)
    }
  })

app
  .use(router.routes())
  .use(router.allowedMethods())

const options = app.env === 'production' ? {
  key: fs.readFileSync('./2.key'),
  cert: fs.readFileSync('./1.crt')
} : {
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

