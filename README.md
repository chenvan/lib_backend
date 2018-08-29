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
- 安装 PGroonga: [链接](https://pgroonga.github.io/install/)
- 安装 node-gyp: [链接](https://github.com/nodejs/node-gyp)