---
title: String
index: true
article: true
category:
  - java
tags:
  - java基础
---

## String
tring 类使用 final 修饰，是所谓的不可变类，无法被继承。
## String常用方法
```java
length() - 长度
charAt() - 指定位置字符
substring(int bigenIndex,int endIndex) - 左闭右开字串
contains(CharSequence s) - 是否包含指定序列
equals(Object anotherObject) - 字符串内容是否相等
indexOf(char ch) indexOf(String str) - 指定字符下标
replace(char olderchar,char newchar) replace(CharSequence target,CharSequence replacement) - 旧的替代新的
trim() - 去除两端空格
split(String regex) - 指定正则拆分
```
## String,StringBuilder,StringBuffer
String、StringBuilder和StringBuffer在 Java 中都是用于处理字符串的，它们之间的区别是，String 是不可变的，平常开发用得最多，当遇到大量字符串连接时，就用 StringBuilder，它不会生成很多新的对象，StringBuffer 和 StringBuilder 类似，但每个方法上都加了 synchronized 关键字，所以是线程安全的。
## String 是不可变类吗？字符串拼接是如何实现的
String 是不可变的，这意味着一旦一个 String 对象被创建，其存储的文本内容就不能被改变。这是因为：

1、不可变性使得 String 对象在使用中更加安全。因为字符串经常用作参数传递给其他 Java 方法，例如网络连接、打开文件等。

如果 String 是可变的，这些方法调用的参数值就可能在不知不觉中被改变，从而导致网络连接被篡改、文件被莫名其妙地修改等问题。

2、不可变的对象因为状态不会改变，所以更容易进行缓存和重用。字符串常量池的出现正是基于这个原因。

当代码中出现相同的字符串字面量时，JVM 会确保所有的引用都指向常量池中的同一个对象，从而节约内存。

3、因为 String 的内容不会改变，所以它的哈希值也就固定不变。这使得 String 对象特别适合作为 HashMap 或 HashSet 等集合的键，因为计算哈希值只需要进行一次，提高了哈希表操作的效率。