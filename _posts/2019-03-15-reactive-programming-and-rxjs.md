---
layout: post
title: '什么是响应式编程和 RxJS'
tags: [code]
---


在计算机领域，响应式编程（英文：Reactive Programming）是一种面向数据流和变更传播的异步编程范式[^1]。就像一个简单的 Click 事件，我们可以通过监听它来做出相应的行为，响应式编程将所有的变量、用户输入、异步接口请求等均看作是可观察的（Observable）数据流，并通过监听这个流来做出响应。

## 响应式编程

学习响应式编程最困难的一点在于要用响应式编程的方式去思考。这也意味着我们要摒弃已有的编程思维，强迫大脑以一种新的方式去思考。下面，我将使用一个真实而简单的例子来展示如何用响应式编程的思维来工作。

假设我们的程序需要监听一个用户列表上 Double clicks 事件，以便可以弹出一个用于编辑用户信息的对话框。

首先我们将用户的 Click 事件当作是一个具有时间顺序的事件流（以下或称为 Stream），这个 Stream 可以释放出三种不同的信号：Value、Error 和 Completed，如下图所示。一般情况，我们的主要工作是定义 Value 信号的事件处理函数。

![Click 事件流示意图]({{site.img_url}}/2019-rx-stream-concept.png){:.center}

响应式编程提供了一系列的函数，如 `map`、`filter` 等，可以将一个 Stream 转化为一个新的 Stream。在我们这个例子中，我们使用了几个简单的函数，将一个普通的 Click 流转化成了 Double clicks 流。

灰色的方框是用来转换 Stream 的函数。首先，我们把连续 250 ms 内的 Click 都积累到一个列表中。结果是一个列表的 Stream ，然后我们使用 `map()` 把每个列表映射为一个整数，即它的长度。最终，我们使用 `filter(x >= 2)` 把整数 1 给过滤掉。就这样，经过这几个操作就生成了我们想要的 Stream。然后我们就可以订阅这个 Stream，并以我们所希望的方式作出反应。

![从普通 Click 事件流到 Double clicks 事件流的处理过程]({{site.img_url}}/2019-rx-multiple-clicks-stream.png){:.center}

最后我们再想想，如果用传统的方式，你会怎么实现上述功能。


## RxJS

RxJS（响应式扩展的 JavaScript 版）是一个使用可观察对象进行响应式编程的 JavaScript 库，它让组合异步代码和基于回调的代码变得更简单。例如 Angular 就是引入 RxJS 使异步编程更可控、更简单。

RxJS 提供了一种对 Observable 类型的实现，以及一些工具函数，用于创建和使用可观察对象。这些工具函数具体如下：

| 类别          | 操作                                                  |
| :-----------: | ----------------------------------------------------- |
| 创建          | `from`, `fromPromise`, `fromEvent`, `of`, `range` 等  |
| 组合          | `combineAll`, `concat`, `merge`, `startWith`, `zip` 等   |
| 过滤          | `debounceTime`, `throttleTime`, `filter`, `take`, `takeUntil` 等 |
| 转换          | `buffer`, `groupBy`, `map`, `mergeMap`, `scan`, `switchMap` 等           |
| 工具          | `tap`, `repeat`, `delay`, `timeInterval` 等            |
| 多播          | `share`, `publish` 等                                 |


下面的代码，是对本文第一节中所举示例的 RxJS 实现。

```ts
import { fromEvent } from 'rxjs';
import { bufferTime, map, filter } from 'rxjs/operators';

const userBox = document.getElementsByClass('user-box');
 
const doubleClicksStream = fromEvent(userBox, 'click').pipe(
  bufferTime(250),
  map(list => list.length),
  filter(x => x >= 2)
);
 
doubleClicksStream.subscribe(data => {
  // Handle the double clicks event
});
```

如果你想更详细的了解 RxJS，可以查看官方的 [RxJS Guide](https://rxjs.dev/guide/overview) 进行学习。

[^1]: 一种编程的方法论，用来指导人们如何思考和解决问题，例如面向对象编程（OOP）或者函数式编程（FP）等。