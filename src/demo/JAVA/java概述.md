---
title: java概述
index: true
article: true
category:
  - java
tags:
  - java基础
---
  
## JAVA语言特点
- 面向对象（封装，多态，继承）
- 多线程支持
- 平台无关性
- 编译与解释并存（**JIT** 即时编译，将字节码转换为热点机器码，提升速度） 
## JVM,JDK,JRE 区别
JDK->JRE->JVM(包含关系)
JDK(Java Development Kit):Java sdk,包括：javac,javadoc,javap。
JRE(Java Runtime Enviroment):Java运行环境，包括运行所需库。
JVM(Java Virtual Machine): Java跨平台关键，不同操作系统不同java实现，JVM负责将java字节码转换为不同平台字节码。
## 跨平台原理

- **编译**：将源代码文件 .java 编译成 JVM 可以识别的字节码文件 .class
- **解释**：JVM 执行字节码文件，将字节码翻译成操作系统能识别的机器码
- **执行**：操作系统执行二进制的机器码
![Java 跨平台原理](<../../附件/Pasted image 20260423213833.png>)

## Java的编译与解释并存
因为先一次性编译成字节码，再解释成机器码（编译是一次性的，解释是一行一行的）
![编译与解释|526](<../../附件/Pasted image 20260423214922.png>)
