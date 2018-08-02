## TODO
- 对 fav, history 表应该对每个 uid 的数量进行限制: 写 sql 手工清除(暂时只想到这个办法)
- 验证 PGroonga 对中文的搜索的作用
- fav 等三表 uid 需要构建 index 吗(需要通过 uid 搜索)
- fav 等三表 bid 需要构建 index 吗(需要 join book 表)

## 问题
### psql
- 无法删除之前建立的 testdb: 
命令结尾没有加 ; 

## 安装
- 安装 PGroonga: [链接](https://pgroonga.github.io/install/)