---
title: java内存机制
index: true
article: true
category:
  - 并发编程
---

## 说一下你对 Java 内存模型的理解？
Java 内存模型是 Java 虚拟机规范中定义的一个抽象模型，用来描述多线程环境中共享变量的内存可见性。
共享变量存储在主内存中，每个线程都有一个私有的本地内存，存储了共享变量的副本。
- 当一个线程更改了本地内存中共享变量的副本，它需要 JVM 刷新到主内存中，以确保其他线程可以看到这些更改。
- 当一个线程需要读取共享变量时，它一版会从本地内存中读取。如果本地内存中的副本是过时的，JVM 会将主内存中的共享变量最新值刷新到本地内存中。

## 为什么线程要用自己的内存？
线程从主内存拷贝变量到工作内存，可以减少 CPU 访问 RAM 的开销。

每个线程都有自己的变量副本，可以避免多个线程同时修改共享变量导致的数据冲突。
## 说说什么是指令重排？
指令重排是指 CPU 或编译器为了提高程序的执行效率，改变代码执行顺序的一种优化技术。

从 Java 源代码到最终执行的指令序列，会经历 3 种重排序：编译器重排序、指令并行重排序、内存系统重排序。
指令重排可能会导致双重检查锁失效，比如A初始化未完成,b读取了A，会造成空指针异常。正确的方式是给 instance 变量加上 volatile 关键字，禁止指令重排。
## happens-before 了解吗？
如果 A Happens-Before B，那么 A 的修改必须对 B 可见，并且 B 不能重排序到 A 之前。
:::info Happens-before
JMM 规定了 6 种 Happens-Before 规则，满足这些规则的操作不会被重排序，并且保证了数据的可见性。

①、程序顺序规则：单线程内，代码按顺序执行；比如 a = 1; b = 2;，a 先于 b 执行。

②、监视器锁定规则：unlock() Happens-Before lock()；比如 synchronized 释放锁后，获取锁的线程能够看到最新的数据。

③、volatile 变量规则：写 volatile 变量 Happens-Before 读 volatile。

④、传递性规则：A Happens-Before B 且 B Happens-Before C，则 A Happens-Before C。例如 a = 1 先于 b = 2，b = 2 先于 c = 3，则 a = 1 先于 c = 3。
⑤、线程启动规则：线程 A 执行操作 ThreadB.start()，那么 A 线程的 ThreadB.start() 操作 happens-before 于线程 B 中的任意操作。

⑥、线程终止规则：线程的所有操作 Happens-Before Thread.join()；例如 t.join(); 之后，主线程一定能看到 t 的修改。
:::
## as-if-serial 了解吗？
As-If-Serial 规则允许 CPU 和编译器优化代码顺序，但不会改变单线程的执行结果。它只适用于单线程，多线程环境仍然可能发生指令重排，需要 volatile 和 synchronized 等机制来保证有序性。
## volatile 了解吗？
第一，保证可见性，线程修改 volatile 变量后，其他线程能够立即看到最新值；第二，防止指令重排，volatile 变量的写入不会被重排序到它之前的代码。
volatile 怎么保证可见性的？
当线程对 volatile 变量进行写操作时，JVM 会在这个变量写入之后插入一个写屏障指令，这个指令会强制将本地内存中的变量值刷新到主内存中。
### volatile 怎么保证有序性的？
JVM 会在 volatile 变量的读写前后插入 “内存屏障”，以约束 CPU 和编译器的优化行为：

- StoreStore 屏障可以禁止普通写操作与 volatile 写操作的重排
- StoreLoad 屏障会禁止 volatile 写与 volatile 读重排
- LoadLoad 屏障会禁止 volatile 读与后续普通读操作重排
- LoadStore 屏障会禁止 volatile 读与后续普
### volatile不是会强制写和查主内存吗，这样不会影响性能吗，像AQS等等java的工具都有用到volatile，他们是怎么解决这个性能问题的
volatile 确实会带来一些开销，主要包括：

- 禁止 CPU 缓存优化，每次都要同步到主内存
- 插入内存屏障，防止指令重排序
- 在某些架构上，会导致 CPU 缓存行失效

第一，现代 CPU 都有多级缓存（L1、L2、L3），volatile 变量虽然不能在寄存器中缓存，但还是可以利用 CPU 缓存的。
只是需要通过缓存一致性协议（MESI）来保证可见性。
第二，JVM 会根据不同的 CPU 架构选择最优的内存屏障实现：
AQS 的设计非常精妙，只在绝对必要的地方使用 volatile。比如 state 必须是 volatile，因为所有线程都要看到最新值，但 Node 中的 nextWaiter 就不需要，因为它只在持有锁的情况下访问。
AQS 大量使用 Unsafe 类进行更细粒度的控制：
## volatile 和 synchronized 的区别？
volatile 关键字用于修饰变量，确保该变量的更新操作对所有线程是可见的，即一旦某个线程修改了 volatile 变量，其他线程会立即看到最新的值。

synchronized 关键字用于修饰方法或代码块，确保同一时刻只有一个线程能够执行该方法或代码块，从而实现互斥访问。
## volatile 加在基本类型和对象上的区别？
当 volatile 用于基本数据类型时，能确保该变量的读写操作是直接从主内存中读取或写入的。
当 volatile 用于引用类型时，能确保引用本身的可见性，即确保引用指向的对象地址是最新的。

但是，volatile 并不能保证引用对象内部状态的线程安全。
虽然 volatile 确保了 obj 引用的可见性，但对 obj 引用的 new SomeObject() 对象并不受 volatile 保护。

如果需要保证引用对象内部状态的线程安全，需要使用 synchronized 或 ReentrantLock 等锁机制。
