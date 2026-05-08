---
title: MYSQL基础
index: true
article: true
category:
  - MYSQL
---

## MYSQL操作
### 删除，建立表
``` sql
CREATE TABLE users (
    id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    PRIMARY KEY (id)
);
DROP TABLE users;
```
### 升序，降序
默认升序 `ASC` 降序 `DESC`
## 连接
### 内连接
两个表中有匹配关系的行
```sql
SELECT users.name, orders.order_id
FROM users
INNER JOIN orders ON users.id = orders.user_id;
```
### 外连接
#### 左外
左表全部，有右表匹配的，没有用null
```sql
SELECT users.id, users.name, orders.order_id
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
```
#### 右外
右表全部
### 交叉连接
笛卡尔积
```sql
SELECT A.id, B.id
FROM A
CROSS JOIN B;
```
## 说一下数据库的三大范式？
1NF:不可分
2NF：完全依赖主键
3NF：消除非主键依赖
## 变量对比
varchar 是可变长度的字符类型,char不可变
blob二进制，text文本
DATETIME 时间完整值，TIMESTAMP时间戳
## IN和EXISTS
执行IN，先执行子查询，EXISTS，存在即可，IN 适用于子查询结果集较小的情况。如果子查询返回大量数据，IN 的性能可能会下降，因为它需要将整个结果集加载到内存。

而 EXISTS 适用于子查询结果集可能很大的情况。由于 EXISTS 只需要判断子查询是否返回行，而不需要加载整个结果集，因此在某些情况下性能更好，特别是当子查询可以使用索引时。
## NULL值缺陷
IN: 如果子查询的结果集中包含 NULL 值，可能会导致意外的结果。例如，WHERE column IN (subquery)，如果 subquery 返回 NULL，则 column IN (subquery) 永远不会为真，除非 column 本身也为 NULL。

EXISTS: 对 NULL 值的处理更加直接。EXISTS 只是检查子查询是否返回行，不关心行的具体值，因此不受 NULL 影响
## 记录货币用什么类型比较好
DEMCIMAL,或者转为整数用BIGINT
## 为什么不推荐使用 FLOAT 或 DOUBLE
FLOAT和DOUBLE浮点数，存储会有精度问题
## 存储emoji
用UTF8mb4(四个字节)
## DROP,DELETE,TRUNCATE
DROP 是物理删除，用来删除整张表，包括表结构，且不能回滚。

DELETE 支持行级删除，可以带 WHERE 条件，可以回滚。

TRUNCATE 用于清空表中的所有数据，但会保留表结构，不能回滚。
## UNION 与 UNION ALL 的区别？
UNION交集去重，UNION ALL 不去重
## count(1)、count(*) 与 count(列名) 的区别？
InnoDB中，count(*)和count(1)没区别，count(列名)只统计不为null
## SQL 查询语句的执行顺序了解吗？
先FROM，然后WHERE,然后GROUP BY,然后HAVING,然后SELECT,最后LIMIT
## MySQL bin 目录下的可执行文件了解吗
mysql：用于连接 MySQL 服务器
mysqldump：用于数据库备份，对数据备份、迁移或恢复时非常有用
mysqladmin：用来执行一些管理操作，比如说创建数据库、删除数据库、查看 MySQL 服务器的状态等。
mysqlcheck：用于检查、修复、分析和优化数据库表，对数据库的维护和性能优化非常有用。
mysqlimport：用于从文本文件中导入数据到数据库表中，适合批量数据导入。
mysqlshow：用于显示 MySQL 数据库服务器中的数据库、表、列等信息。
mysqlbinlog：用于查看 MySQL 二进制日志文件的内容，可以用于恢复数据、查看数据变更等。
## MySQL 第 3-10 条记录怎么查
```sql
SELECT id FROM student LIMIT 2,8;
```
偏移值，长度
## 说说 SQL 的语法树解析？
1. 词法分析:拆解SQL语句，识别关键字，表明，列名
2. 语法分析:检查是否符合语法规则，识别是否符合语法规则，构建抽象语法树，
3，语义分析: 检查表列,权限验证
