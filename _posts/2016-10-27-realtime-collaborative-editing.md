---
layout: post
title: '实时协同编辑和 OT 算法'
tags: [code]
---


随着工作任务的规模和复杂度日益增大，团队中的协同成为工作中的常态。

1984 年，MIT 的科学家提出了计算机支持的协同工作（Computer Supported Cooperative Work，缩写为 CSCW），使得人们可以借助计算机和互联网去完成协同工作。比如利用用于文档编辑的 Wikis 和用于编程的版本控制系统，小组成员可以在世界任意角落去共同编写大型的百科全书或软件系统。


## 一、实时协同编辑的概念和原理

实时协同编辑，通俗来讲，是指多人同时在线编辑一个文档，且当一个参与者编辑文档的某处时，这个修改会立即同步到其他参与者的计算机上。归纳起来，需要下面几个步骤：

1. 计算出当前参与者对文档做出的修改，并发送到服务器
2. 在服务器端，对所有参与者的修改进行合并以及冲突处理
3. 将合并之后的结果返回到所有参与者的计算机上
4. 将光标移动到正确的位置

由于没有锁的机制，当多个参与者在编辑同一处内容时，便可能出现冲突，这个时候就需要通过一定的算法来自动地解决这些冲突。最后，当所有改变都同步后，每个参与者计算机上所看到的文档内容应该是完全一致的。


## 二、Operational Transformation 算法

Operational Transformation（简称 OT）是一个用于在协同编辑中自动合并多个修改的算法，它最早发表于 1989 年，随后因 Google 在其在线协作产品 Google Wave 中大量使用而流行。

在 OT 算法中，可以将对文档的修改转义成三种类型的操作（Operation）：

1. `retain(n)`：保持 n 个字符
2. `insert(s)`：插入字符串 s
3. `delete(s)`：删除字符串 s

例如，假设用户 Alice 将 `hello, tom!` 修改成 `hello, world!`，相当于产生了如下的操作序列 `operationA`：

```js
retain(7)
delete('tom')
insert('world')
retain(1)
```

注意上面代码中最后的一个 Retain 操作。实际上，Retain 操作像一个虚拟的光标，从文档的开始位置遍历，在需要修改的地方进行 Insert 或 Delete 操作，直到文档末尾。

在 Alice 编辑文档的同时，用户 Bob 也对原文档进行了修改，并产生了如下的操作序列 `operationB`：

```js
delete('hello')
insert('hi')
retain(6)
```

对应地，Bob 修改后的文档应该是 `hi, tom!`。此时，Alice 和 Bob 的修改便会产生冲突，于是我们需要对这组操作进行一定的转换（Transform）：

```js
var [operationAPrime, operationBPrime] = OT.transform(operationA, operationB)
var strAB = operationAPrime.apply('hi, tom!')       // 'hi, world!'
var strBA = operationBPrime.apply('hello, world!')  // 'hi, world!'
```

这样在经过转换操作后，Alice 和 Bob 两个人最终看到的文档便会是一致的。

## 三、一个示例

![一个简单的 OT 协同编辑示例]({{site.img_url}}/2016-collaborative-editing-demo.png){:.center}

该示例中使用 CodeMirror 作为编辑器，实现了一个可实时协同的 Markdown 编辑器，其代码具有一定的参考价值。启动方法：

```sh
git clone https://github.com/Operational-Transformation/ot-demo.git
cd ot-demo
npm install
node backends/node/server.js
```

## 四、参考资料

1. [Operational transformation - Wikipedia](https://en.wikipedia.org/wiki/Operational_transformation)
2. [Operational Transformation in JavaScript](https://operational-transformation.github.io/ot-for-javascript.html)
