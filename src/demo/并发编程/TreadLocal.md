---
title: TreadLocal
index: true
article: true
category:
  - 并发编程
---

## ThreadLocal 是什么？
ThreadLocal 是一种用于实现线程局部变量的工具类。它允许每个线程都拥有自己的独立副本，从而实现线程隔离。

```java
//创建一个ThreadLocal变量
public static ThreadLocal<String> localVariable = new ThreadLocal<>();
//设置ThreadLocal变量的值
localVariable.set("111");
//获取ThreadLocal变量的值
String value = localVariable.get();
//删除ThreadLocal变量的值
localVariable.remove();
```
在 Web 应用中，可以使用 ThreadLocal 存储用户会话信息，这样每个线程在处理用户请求时都能方便地访问当前用户的会话信息。

在数据库操作中，可以使用 ThreadLocal 存储数据库连接对象，每个线程有自己独立的数据库连接，从而避免了多线程竞争同一数据库连接的问题。
在格式化操作中，例如日期格式化，可以使用 ThreadLocal 存储 SimpleDateFormat 实例，避免多线程共享同一实例导致的线程安全问题。
## ThreadLocal 有哪些优点？
每个线程访问的变量副本都是独立的，避免了共享变量引起的线程安全问题。由于 ThreadLocal 实现了变量的线程独占，使得变量不需要同步处理，因此能够避免资源竞争。

ThreadLocal 可用于跨方法、跨类时传递上下文数据，不需要在方法间传递参数。
## 你在工作中用到过 ThreadLocal 吗？
有用到过，用来存储用户信息。
登录后的用户每次访问接口，都会在请求头中携带一个 token，在控制层可以根据这个 token，解析出用户的基本信息。

假如在服务层和持久层也要用到用户信息，就可以在控制层拦截请求把用户信息存入 ThreadLocal。
这样我们在任何一个地方，都可以取出 ThreadLocal 中存的用户信息。
很多其它场景的 cookie、session 等等数据隔离都可以通过 ThreadLocal 去实现。
## ThreadLocal 怎么实现的呢？
当我们创建一个 ThreadLocal 对象并调用 set 方法时，其实是在当前线程中初始化了一个 ThreadLocalMap。
ThreadLocalMap 是 ThreadLocal 的一个静态内部类，它内部维护了一个 Entry 数组，key 是 ThreadLocal 对象，value 是线程的局部变量，这样就相当于为每个线程维护了一个变量副本。
Entry 继承了 WeakReference，它限定了 key 是一个弱引用，弱引用的好处是当内存不足时，JVM 会回收 ThreadLocal 对象，并且将其对应的 Entry.value 设置为 null，这样可以在很大程度上避免内存泄漏。
:::info 标答
ThreadLocal 的实现原理是，每个线程维护一个 Map，key 为 ThreadLocal 对象，value 为想要实现线程隔离的对象。

1、通过 ThreadLocal 的 set 方法将对象存入 Map 中。
2、通过 ThreadLocal 的 get 方法从 Map 中取出对象。
3、Map 的大小由 ThreadLocal 对象的多少决定。
```
## 什么是弱引用，什么是强引用？
强引用和弱引用，本质上是在说：对象被引用时，垃圾回收器 GC 要不要保留它。
## ThreadLocal 内存泄露是怎么回事？
ThreadLocalMap 的 Key 是 弱引用，但 Value 是强引用。

如果一个线程一直在运行，并且 value 一直指向某个强引用对象，那么这个对象就不会被回收，从而导致内存泄漏。
## 那怎么解决内存泄漏问题呢？
很简单，使用完 ThreadLocal 后，及时调用 remove() 方法释放内存空间。
## 你每次操作都会remove吗？
我不是每次操作都 remove，主要是根据使用场景来决定的。在一些短生命周期的场景中，比如处理单个 HTTP 请求的上下文信息，我通常会在请求结束时统一 remove。
## ThreadLocalMap 怎么解决 Hash 冲突的
开放定址法。

如果计算得到的槽位 i 已经被占用，ThreadLocalMap 会采用开放地址法中的线性探测来寻找下一个空闲槽位：

如果 i 位置被占用，尝试 i+1。

如果 i+1 也被占用，继续探测 i+2，直到找到一个空位。

如果到达数组末尾，则回到数组头部，继续寻找空位。
## 为什么要用线性探测法而不是HashMap 的拉链法来解决哈希冲突？
ThreadLocalMap 设计的目的是存储线程私有数据，不会有大量的 Key，所以采用线性探测更节省空间。

拉链法还需要单独维护一个链表，甚至红黑树，不适合 ThreadLocal 这种场景。
## ThreadLocalMap 扩容机制了解吗？
与 HashMap 不同，ThreadLocalMap 并不会直接在元素数量达到阈值时立即扩容，而是先清理被 GC 回收的 key，然后在填充率达到四分之三时进行扩容。
清理过程会遍历整个数组，将 key 为 null 的 Entry 清除。
阈值 threshold 的默认值是数组长度的三分之二。
扩容时，会将数组长度翻倍，然后重新计算每个 Entry 的位置，采用线性探测法来寻找新的空位，然后将 Entry 放入新的数组中。
一句话总结：ThreadLocalMap 采用的是“先清理再扩容”的策略，扩容时，数组长度翻倍，并重新计算索引，如果发生哈希冲突，采用线性探测法来解决。
## 父线程能用 ThreadLocal 给子线程传值吗？
不能。
因为 ThreadLocal 变量存储在每个线程的 ThreadLocalMap 中，而子线程不会继承父线程的 ThreadLocalMap。

可以使用 InheritableThreadLocal来解决这个问题。
## InheritableThreadLocal的原理了解吗？
普通 ThreadLocal 变量存储在 threadLocals 中，不会被子线程继承。

InheritableThreadLocal 变量存储在 inheritableThreadLocals 中，当 new Thread() 创建一个子线程时，Thread 的 init() 方法会检查父线程是否有 inheritableThreadLocals，如果有，就会拷贝 InheritableThreadLocal 变量到子线程：

