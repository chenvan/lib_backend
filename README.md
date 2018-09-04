## 注意有几个文件由于没有同步, 需要自己创建. 文件需包含的内容可看 .gitignore

library.setting.json
knex.setting.json
helper/isAdmin.js

## TODO
- 对 fav, history 表应该对每个 uid 的数量进行限制: 写 sql 手工清除(暂时只想到这个办法)

## 问题
### psql
- 系统本身有一个表的名字叫 user, 与自己创建的表 user 重名, 使用自己的表时要用双引号
- sql terminal 显示乱码的问题:
1. \! chcp 65001
2. set client_encoding to 'utf8'
并不能完全解决问题, terminal 的提示字符变成乱码
另: 自己的 dummy.js 的中文没有乱码的问题, 从豆瓣获取的数据则有乱码问题


## 安装
1. postgresql 的安装 & 设定(centos): [链接](https://www.linode.com/docs/databases/postgresql/how-to-install-postgresql-relational-databases-on-centos-7/)
安装完毕后, linux 会多一个 postgres 用户, 而数据库也有一个 postgres 用户, 文章有写两个用户设定密码的方式.
记得一定要看 Secure Local Access 章节, 要通过修改 pg_hba.conf 才能令程序通过用户名和密码访问数据库, 由于"With psql you are using unix socket to connect DB and with knex you are trying to use TCP connection", 所以我全部方式都改为 md5 的方式
2. 建数据库 library 和 library_test
3. 安装 PGroonga: [链接](https://pgroonga.github.io/install/)
4. 安装 node-gyp: [链接](https://github.com/nodejs/node-gyp)
5. 使用 git 复制 [lib_backend](https://github.com/chenvan/lib_backend): [链接](https://help.github.com/articles/cloning-a-repository/)
6. yarn 安装: [链接](https://yarnpkg.com/en/docs/usage)
7. 补全以下文件: library.setting.json, knex.setting.json, helper/isAdmin.js
8. 补全 validate 文件夹以及证书
9. 运行 knex migrate:latest --env prodution
10. 运行 addUser.js, addBook.js. 格式为 NODE_ENV=production node script.js data.txt
11. 设定 pm2 自启动: [链接](https://pm2.io/doc/en/runtime/guide/startup-hook/)

