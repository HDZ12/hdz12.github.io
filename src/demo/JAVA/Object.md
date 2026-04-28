---
title: Object
index: true
article: true
category:
  - java
tags:
  - java基础
---

## Object类常见方法
### 对象比较
```java
public native int hashCode();
```
按照约定，相等的对象必须具有相等的哈希码。如果重写了 equals 方法，就应该重写 hashCode 方法。可以使用 Objects.hash() 方法来生成哈希码。
```java
public boolean equals(Object obj) {
    return (this==obj);
}
```
public boolean equals(Object obj)：用于比较 2 个对象的内存地址是否相等。如果比较的是两个对象的值是否相等，就要重写该方法，比如 String 类、Integer 类等都重写了该方法。
## 对象拷贝
protected native Object clone() throws CloneNotSupportedException：naitive 方法，返回此对象的一个副本。默认实现只做浅拷贝，且类必须实现 Cloneable 接口。

Object 本身没有实现 Cloneable 接口，所以在不重写 clone 方法的情况下直接直接调用该方法会发生 CloneNotSupportedException 异常。
## 对象转字符串：
public String toString()：返回对象的字符串表示。默认实现返回类名@哈希码的十六进制表示，但通常会被重写以返回更有意义的信息。
## 多线程调度：
每个对象都可以调用 Object 的 wait/notify 方法来实现等待/通知机制。
## 反射：
public final native Class<?> getClass()：用于获取对象的类信息，如类名。
