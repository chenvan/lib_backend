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

// app.use(async (ctx, next) => {
//   try {
//     await next()
//   } catch (err) {
//     console.log('catch error:', err)
//     let message = err.message
//     ctx.status = 401
//     ctx.body = {message}
//   }
// })

router
  .use(async (ctx, next) => {
    try {
      // console.log('pass error handler')
      await next()
    } catch (err) {
      console.log('catch error:', err)
      let message = err.message
      ctx.status = 401
      ctx.body = {message}
    }
  })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/test\/1/)) {
//     ctx.body = {
//       message: 'hello world'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

router
  .get('/test/1', async ctx => {
    ctx.body = {
      message: 'hello world'
    }
  })



// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/login/)) {
//     let user = await db.verifyUser(ctx.request.body.uid, ctx.request.body.pwd)
//     // how to check if isAdmin
//     ctx.body = {
//       user,
//       token: jwt.sign({uid: user.uid, isAdmin: isAdmin(user.uid)}, libSetting.secret, {expiresIn: '1h'})
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

router
  .post('/login', async ctx => {
    let user = await db.verifyUser(ctx.request.body.uid, ctx.request.body.pwd)
    ctx.body = {
      user,
      token: jwt.sign({uid: user.uid, isAdmin: isAdmin(user.uid)}, libSetting.secret, {expiresIn: '1h'})
    }
  })

// app.use(koaJwt({secret: libSetting.secret, key: 'jwtdata'}))

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/test\/2/)) {
//     ctx.body = {
//       message: 'hello world'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

router.use(koaJwt({secret: libSetting.secret, key: 'jwtdata'}))

router
  .get('/test/2', async ctx => {
    ctx.body = {
      message: 'hello world'
    }
  })

// combine fav, history, borrowing api to one api 
// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/fav/)) {
//     let favList = await db.getUserInfo('fav', ctx.state.jwtdata.uid)
//     ctx.body = {
//       favList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/history/)) {
//     let historyList = await db.getUserInfo('history', ctx.state.jwtdata.uid)
//     ctx.body = {
//       historyList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/borrowing/)) {
//     let borrowingList = await db.getUserInfo('borrowing', ctx.state.jwtdata.uid)
//     ctx.body = {
//       borrowingList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

router
  .get('/user/:info', async ctx => {
    ctx.body = {
      [ctx.params.info + 'List'] : await db.getUserInfo(ctx.params.info, ctx.state.jwtdata.uid)
    }
  })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/type/)) {
//     let typeList = await db.getType()
//     ctx.body = {
//       typeList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/searchtype/)) {
//     let resultList = await db.searchType(ctx.request.body.type, ctx.request.body.lastBid)
//     ctx.body = {
//       resultList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   } 
// })

router
  .get('/type', async ctx => {
    ctx.body = {
      typeList: await db.getType()
    }
  })
  .post('/type', async ctx => {
    ctx.body = {
      resultList: await db.searchType(ctx.request.body.type, ctx.request.body.lastBid)
    }
  })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/search$/)) {
//     let resultList = await db.search(ctx.request.body.info)
//     ctx.body = {
//       resultList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

router.post('/search', async ctx => {
  ctx.body = {
    resultList: await db.search(ctx.request.body.info)
  }
})

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/changepwd/)) {
//     await db.changepwd(ctx.state.jwtdata.uid, ctx.request.body.oldpwd, ctx.request.body.newpwd)
//     ctx.body = {
//       message: '密码修改成功'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/addtofav/)) {
//     await db.addToFav(ctx.state.jwtdata.uid, ctx.request.body.bid)
//     ctx.body = {
//       message: '添加成功'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/borrow$/)) {
//     if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
//     await db.borrowBook(ctx.request.body.uid, ctx.request.body.bid)
//     ctx.body = {
//       message: '借阅成功'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/return/)) {
//     if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
//     await db.returnBook(ctx.request.body.uid, ctx.request.body.bid)
//     ctx.body = {
//       message: '还书成功'
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

// app.use(async (ctx, next) => {
//   if (ctx.url.match(/^\/api\/outdated/)) {
//     if (!ctx.state.jwtdata.isAdmin) ctx.throw(400, '非管理员') // the status is not correct
//     let outdatedList = await db.getOutdatedList()
//     ctx.body = {
//       outdatedList
//     }
//     ctx.status = 200
//   } else {
//     await next()
//   }
// })

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

