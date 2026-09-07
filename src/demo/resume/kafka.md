---
title: kafka
index: true
article: true
category:
  - resume
---
## Kafka 复习笔记（架构、核心概念、磁盘/内存原理）

> 适合面试复习 / 后端开发理解  
> 核心关键词：
>
> **Kafka = 高吞吐、可持久化、可回放的分布式消息队列系统**

---

# 1. Kafka 是什么？

## 一句话理解

Kafka 是一个**分布式消息队列（Message Queue）/ 事件流平台**。

它主要解决：

1. 系统之间异步通信
2. 削峰填谷
3. 日志收集
4. 数据流处理
5. 数据重新消费（Replay）


例如：

没有 Kafka：

```
用户上传文件
      |
      ↓
文件服务
      |
      ↓
AI向量化服务
      |
      ↓
数据库
```

问题：

- AI服务慢，上传接口被拖慢
- AI服务挂了，数据丢失


加入 Kafka：

```
             Kafka
              |
              |
用户上传 ---> Topic
              |
              |
       AI消费者慢慢处理
```

上传只负责：

```
写消息
```

处理：

```
异步完成
```

---

# 2. Kafka 核心模型

Kafka 可以理解成：

```
生产者 Producer

        |
        |
        ↓

      Kafka

        |
        |
        ↓

消费者 Consumer
```


---

# 3. Producer（生产者）

## 定义

生产消息的一方。


例如：

用户上传文件：

```json
{
 "file_id":1001,
 "name":"a.pdf"
}
```

上传服务：

```
Producer
```

把消息发送到 Kafka。


例子：

```
订单系统

创建订单

      |
      |
      ↓

Kafka

      |
      ↓

库存系统
短信系统
物流系统
```


订单系统就是 Producer。

---

# 4. Consumer（消费者）


## 定义

读取 Kafka 消息的一方。


例如：

Kafka里面：

```
订单创建事件
```

消费者：

```
库存服务
```

读取：

```
扣库存
```


另一个消费者：

```
短信服务
```

读取：

```
发送短信
```


---

# 5. Topic（主题）

Kafka 用 Topic 分类消息。


例如：

Kafka：

```
Topic: order_created

消息:
订单1
订单2
订单3
```


另一个：

```
Topic: user_register

消息:
用户A注册
用户B注册
```


类似数据库的表：

```
MySQL

table=user


Kafka

topic=user_register
```


---

# 6. Partition（分区）

这是 Kafka 最重要的概念。


一个 Topic 可以有多个 Partition。


例如：

Topic:

```
order_created
```


有三个分区：

```
Partition 0

订单1
订单4
订单7


Partition 1

订单2
订单5
订单8


Partition 2

订单3
订单6
订单9

```


为什么需要 Partition？


因为一个机器处理不了亿级消息。


所以拆开：

```
Topic

        |
        |
 ---------------------
 |        |           |
P0       P1          P2

机器1    机器2       机器3

```


实现：

- 并行处理
- 提高吞吐量

---

# 7. Partition 和顺序性


Kafka 保证：

## 一个 Partition 内有序

例如：

```
Partition 0


offset

0 订单创建
1 支付成功
2 发货
3 完成
```


一定按：

```
0 → 1 → 2 → 3
```


但是：

多个 Partition：

```
P0

订单A
订单C


P1

订单B
订单D

```

整体：

```
A B C D
```

不保证。


所以：

如果订单必须保证顺序：

例如：

```
同一个用户订单
```

可以：

```
user_id作为key

hash(user_id)

决定进入哪个Partition
```


这样：

同一个用户：

```
永远进入同一个Partition
```


---

# 8. Offset（偏移量）


Kafka 每条消息都有编号。


例如：

```
Partition 0


offset    message

0         文件A
1         文件B
2         文件C
3         文件D

```


消费者记录：

```
我消费到哪里了
```


例如：

Consumer:

```
offset=2
```


表示：

已经处理：

```
0
1
2
```


下次：

从：

```
3
```

开始。


---

# 9. Consumer Group（消费者组）


多个消费者组成一个组。


例如：

Topic:

```
Partition:

P0
P1
P2
```


消费者组：

```
group-A


consumer1 ---> P0

consumer2 ---> P1

consumer3 ---> P2

```


每个 Partition：

只能被一个组内消费者消费。


目的：

提高处理速度。


---

# 10. Leader 和 Follower


Kafka 是分布式系统。

为了防止机器挂掉：

Partition 会复制。


例如：

一个 Partition：

```
P0
```


复制三份：

```
P0 Leader

P0 Follower1

P0 Follower2

```


---

## Leader

负责：

- 接收生产消息
- 提供读取服务
- 管理数据


例如：

Producer：

```
发送消息
```

发送给：

```
Leader
```


---

## Follower


负责：

复制 Leader 数据。


例如：

Leader:

```
消息A
消息B
消息C
```


Follower同步：

```
消息A
消息B
消息C
```


---

如果 Leader 挂了：

```
Leader挂掉


Follower1升级成为Leader

继续工作

```


这就是高可用。

---

# 11. Kafka 数据怎么存？

重点来了：

Kafka 主要依靠：

# 磁盘

不是主要靠内存。


很多人误认为：

> 高性能系统一定放内存


Kafka：

```
磁盘存储
+
操作系统缓存
+
顺序写
```

实现高性能。


---

# 12. Kafka 磁盘存储结构


例如：

Topic：

```
file_event
```


Partition：

```
partition-0
```


磁盘：

```
partition-0/

000000.log

000000.index

000000.timeindex

```


其中：

## log 文件

真正的数据。


例如：

```
offset 0 文件A

offset 1 文件B

offset 2 文件C

```


---

## index 文件


记录：

```
offset

对应磁盘位置
```


例如：

```
offset 100

↓

文件第5000字节
```


查找不用扫描整个文件。

---

# 13. 为什么磁盘还能这么快？


普通数据库：

随机写：

```
磁盘:

1000位置
200位置
9000位置

到处写
```


很慢。


Kafka：

顺序写：

```
磁盘:

0
1
2
3
4
5

一直追加
```


类似：

写日志。


磁盘最擅长：

顺序写。


---

# 14. Kafka 和内存关系


Kafka 不直接：

```
数据全部放RAM
```


而是：

```
Producer

 ↓

Kafka

 ↓

磁盘文件


 ↑

操作系统Page Cache缓存
```


---

# 15. Page Cache（页缓存）


Linux 有：

```
磁盘
 |
 |
内核缓存
 |
 |
程序
```


Kafka 写数据：

流程：

```
Producer

 ↓

Kafka

 ↓

OS Page Cache

 ↓

磁盘
```


读取：

```
Consumer

 ↓

Page Cache

 ↓

返回

```


如果数据还在缓存：

不用访问磁盘。


速度非常快。

---

# 16. 内存处理 vs 磁盘处理区别


| |内存|磁盘|
|-|-|-|
|速度|非常快|慢|
|容量|小|大|
|成本|高|低|
|断电|数据丢失|可以保存|
|适合|缓存|持久化|


---

例子：

Redis：

```
主要内存

速度极快

但是容量有限
```


Kafka：

```
主要磁盘

容量巨大

还能保证高吞吐
```


---

# 17. Kafka 一条消息完整流程


例如：

上传文件：


## 第一步 Producer发送


```
文件服务

生成:

file_uploaded_event


发送Kafka
```


---

## 第二步 找Partition


Kafka根据：

```
key
```

决定：

```
Partition
```


例如：

```
file_id=1001

hash(file_id)

↓

Partition 2
```


---

## 第三步 Leader写入


```
Partition2 Leader


写入:

offset=500

```


---

## 第四步 Follower复制


```
Leader

↓

Follower1

↓

Follower2

```


---

## 第五步 Consumer读取


消费者：

```
vector-service
```


读取：

```
offset=500
```


执行：

```
生成embedding
```


提交：

```
offset=501
```


---

# 18. Kafka 为什么可以重跑历史数据？


因为：

Kafka不是删除消息。


例如：

```
offset

0 文件A
1 文件B
2 文件C
3 文件D

```


以前：

```
consumer-group-old

消费到3
```


新建：

```
consumer-group-new

offset=0
```


重新：

```
文件A
文件B
文件C
文件D

```


所以：

模型升级：

重新消费即可。


---

# 19. Kafka 和数据库区别


| |Kafka|MySQL|
|-|-|-|
|定位|消息流|数据存储|
|数据模型|日志流|表|
|读取方式|顺序读取|查询|
|写入|追加|更新|
|吞吐|非常高|较低|
|用途|事件传递|业务数据|


---

# 20. 面试常考总结


## Kafka 为什么快？

回答：

> Kafka通过Partition水平扩展，通过顺序写磁盘提高写入性能，同时利用Linux Page Cache减少磁盘读取，并通过批量发送、压缩提高吞吐。


---

## Kafka 为什么不用内存？

回答：

> 内存容量有限且断电丢失，而Kafka需要保存大量历史消息，因此采用磁盘持久化，同时利用操作系统缓存获得接近内存级别的读取性能。


---

## Leader/Follower作用？

回答：

> Leader负责读写请求，Follower负责复制数据。当Leader故障时，从Follower中选举新的Leader，提高系统可用性。


---

## Partition作用？

回答：

> Partition用于水平扩展，一个Topic可以拆成多个Partition，让多个消费者并行处理，提高吞吐量。


---

## Kafka核心结构图


```
                 Producer

                    |
                    |

                 Topic

          ---------------------

          Partition0
          Partition1
          Partition2

          |       |       |

       Leader  Leader  Leader

          |
       Follower

          |

       Disk Log

          |

     Consumer Group

          |

      Consumer
```


**一句话记忆：**

> Kafka 是一个把消息按 Topic 分区存储到磁盘日志中的分布式系统，Producer 写入 Partition Leader，Follower复制保证高可用，Consumer Group 消费消息，通过 offset 记录进度，实现高吞吐和可回放。