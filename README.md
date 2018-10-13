#### 注意下面文件是没有同步的, 需要自己创建. 每个文件应包含的内容可看 .gitignore 注释

- library.setting.json
- knex.setting.json
- helper/isAdmin.js

## 问题
### psql

- 系统本身有一个表的名字叫 user, 与自己创建的表 user 重名, 使用自己的表时要用双引号
## 安装
1. postgresql 的安装 & 设定(centos): [链接](https://www.linode.com/docs/databases/postgresql/how-to-install-postgresql-relational-databases-on-centos-7/)
  安装完毕后, linux 会多一个 postgres 用户, 而数据库也有一个 postgres 用户, 文章有写两个用户设定密码的方式.
  记得一定要看 Secure Local Access 章节, 要通过修改 pg_hba.conf 才能令程序通过用户名和密码访问数据库,

  另: 因为使用 knex 来操作数据库, 而"With psql you are using unix socket to connect DB and with knex you are trying to use TCP connection", 所以更改 pg_hba.conf 设定时, 把全部链接方式都改为 md5 的方式

2. 建数据库 library 和 library_test

3. 安装 PGroonga: [链接](https://pgroonga.github.io/install/)

4. 安装 Node: [链接](https://linuxize.com/post/how-to-install-node-js-on-centos-7/)

5. 安装 git

4. 安装 node-gyp: [链接](https://github.com/nodejs/node-gyp)

5. 使用 git 复制 [lib_backend](https://github.com/chenvan/lib_backend): [链接](https://help.github.com/articles/cloning-a-repository/)

6. 安装 yarn: [链接](https://yarnpkg.com/en/docs/usage)

7. 补全以下文件: library.setting.json, knex.setting.json, helper/isAdmin.js

8. 补全 validate 文件夹以及证书(看具体情况)

9. 运行 knex migrate:latest --env production

10. 运行 addUser.js, addBook.js. 格式为 NODE_ENV=production node script.js data.txt

11. 设定 pm2 自启动: [链接](https://pm2.io/doc/en/runtime/guide/startup-hook/)


## 导入数据的格式说明

#### 通过两个 txt 文档进行导入, 一个是关于用户的数据, 另一个是关于书的数据. 由于是通过空格提取数据, 所以若数据本身带有空格将会令数据提取发生错位.

- 用户

  每一行有两个数据, 分别是工号和姓名, 数据之间用空格分开

  eg: 000000 汪汪

- 书

  每一行有五个数据, 分别是 ISBN号, 书名, 书的归类(小说, 技术这种分类), 数量, 书主(可不填), 数据之间用空格分开 

  eg:  9787543898752 无证之罪  小说  1   汪汪

## TODO

- history 表应该对每个 uid 的数量进行限制: 写 sql 手工清除(暂时只想到这个办法)