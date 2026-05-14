---
title: ubuntu
index: true
article: true
category:
  - ICAUS
---

## 修改到桥接模式
![VMware](../../附件/1778756189047.png)
VMware->虚拟机设置
改完之后执行
```shell
sudo dhclient -r ens33
sudo dhclient ens33
```
