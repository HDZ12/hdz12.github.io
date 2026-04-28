---
title: Integer
index: true
article: true
category:
  - java
tags:
  - java基础
---

## Integer a= 127，Integer b = 127；Integer c= 128，Integer d = 128；相等吗?
a 和 b 相等，c 和 d 不相等。

这个问题涉及到 Java 的自动装箱机制以及Integer类的缓存机制。

对于第一对：
```java
Integer a = 127;
Integer b = 127;
```
a和b是相等的。这是因为 Java 在自动装箱过程中，会使用Integer.valueOf()方法来创建Integer对象。

Integer.valueOf()方法会针对数值在(-128 到 127)。
因此，自动装箱过程会为c和d创建两个不同的Integer对象，它们有不同的引用地址。

## 什么是 Integer 缓存
就拿 Integer 的缓存吃来说吧。根据实践发现，大部分的数据操作都集中在值比较小的范围，因此 Integer 搞了个缓存池，默认范围是 -128 到 127。
当我们使用自动装箱来创建这个范围内的 Integer 对象时，Java 会直接从缓存中返回一个已存在的对象，而不是每次都创建一个新的对象。这意味着，对于这个值范围内的所有 Integer 对象，它们实际上是引用相同的对象实例。

Integer 缓存的主要目的是优化性能和内存使用。对于小整数的频繁操作，使用缓存可以显著减少对象创建的数量。

可以在运行的时候添加  -Djava.lang.Integer.IntegerCache.high=1000 来调整缓存池的最大值。
引用是 Integer 类型，= 右侧是 int 基本类型时，会进行自动装箱，调用的其实是 Integer.valueOf()方法，它会调用 IntegerCache。
```java
public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);
}
```
IntegerCache 是一个静态内部类，在静态代码块中会初始化好缓存的值。
```java
private static class IntegerCache {
    ……
    static {
        //创建Integer对象存储
        for(int k = 0; k < cache.length; k++)
            cache[k] = new Integer(j++);
        ……
    }
}
```
## new Integer(10) == new Integer(10) 相等吗
在 Java 中，使用new Integer(10) == new Integer(10)进行比较时，结果是 false。

这是因为 new 关键字会在堆（Heap）上为每个 Integer 对象分配新的内存空间，所以这里创建了两个不同的 Integer 对象，它们有不同的内存地址。

当使用==运算符比较这两个对象时，实际上比较的是它们的内存地址，而不是它们的值，因此即使两个对象代表相同的数值（10），结果也是 false。
## String怎么转换成为Integer的
两个方法：
```java
Integer.valueOf()
Integer.parseInt()
```
不管哪一种，最终还是会调用 Integer 类内中的parseInt(String s, int radix)方法。
```java
public static int parseInt(String s, int radix)
                throws NumberFormatException
    {

        int result = 0;
        //是否是负数
        boolean negative = false;
        //char字符数组下标和长度
        int i = 0, len = s.length();
        ……
        int digit;
        //判断字符长度是否大于0，否则抛出异常
        if (len > 0) {
            ……
            while (i < len) {
                // Accumulating negatively avoids surprises near MAX_VALUE
                //返回指定基数中字符表示的数值。（此处是十进制数值）
                digit = Character.digit(s.charAt(i++),radix);
                //进制位乘以数值
                result *= radix;
                result -= digit;
            }
        }
        //根据上面得到的是否负数，返回相应的值
        return negative ? result : -result;
    }
```
