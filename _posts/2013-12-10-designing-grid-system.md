---
layout: post
title: '如何设计一个简单的栅格系统'
tags: [code]
---


页面设计中的栅格系统是一种平面设计的方法与风格。运用固定的格子（包含了水平和垂直方向的参考线）设计版面布局，使页面风格工整简洁。

下面我将要介绍是如何实现一个简单的（只有 100 行的 CSS 代码）、响应式（自动适应三种类型屏幕上的显示）的栅格系统。

## 第一步、定义容器 container 和 row

我定义了三种类型的屏幕：手机屏幕、平板屏幕和桌面屏幕。而下面的代码使得，浏览器会根据自身的宽度而使用不同值的 `container` 的宽度：

~~~css
@media all and (min-width: 800px) {
    .container {
        width: 770px;
    }
}

@media all and (min-width: 1000px) {
    .container {
        width: 970px;
    }
}

@media all and (min-width: 1200px) {
    .container {
        width: 1170px;
    }
}
~~~

`row` 是处于 `container` 与 `col` 之间的一个过渡容器。这样使得在一个 `container` 中可以同时包含多个分栏。同时，`row` 可以有效的消除容器左右两端 `15px` 的误差。

~~~css
.row {
    margin: 0 -15px;
}
~~~

## 第二步、将 row 分为六栏

对于平板屏幕和桌面屏幕，我们将 `row` 平均分为六栏，它们要并排排列。如果是手机屏幕的话，这六栏将会按照顺序向下堆叠。

~~~css
@media all and (min-width: 800px) {
    .col-1,
    .col-2,
    .col-3,
    .col-4,
    .col-5,
    .col-6 {
        float: left;
    }
    .col-6 {
        width: 100%;
    }
    .col-5 {
        width: 83.333333%
    }
    .col-4 {
        width: 66.666667%
    }
    .col-3 {
        width: 50%
    }
    .col-2 {
        width: 33.333333%
    }
    .col-1 {
        width: 16.666667%
    }
}
~~~

## 第三步、清除浮动

在上面的分栏中，我们使用了 Float 属性进行浮动布局，所以在必要的地方，我们要对其清除，使得 `col` 处于父容器 `row` 的包裹之中。

~~~css
.container:before,
.container:after {
    display: table;
    content: " ";
}

.container:after {
    clear: both;
}

.row:before,
.row:after {
    display: table;
    content: " ";
}

.row:after {
    clear: both;
}
~~~

## 第四步、设置边距

处理栅格系统的边距是一件比较复杂的工作。首先，我们将容器的 `bos-sizing` 设置为 `border-box`，这样当我们指定容器的宽度时，它将包含 `padding` 及 `border`。然后，将 `col` 左右的 `padding` 定义为 `15px`，这样，相邻两列之间的边距将会变为 `30px`。

~~~css
.container {
    -moz-box-sizing: border-box;
         box-sizing: border-box;
    padding: 0 15px;
    margin: 0 auto;
}

.col-1,
.col-2,
.col-3,
.col-4,
.col-5,
.col-6 {
    position: relative;
    -moz-box-sizing: border-box;
         box-sizing: border-box;
    min-height: 1px;
    padding: 0 15px;
}
~~~

## 获取源代码

我把源码放到了 GitHub 上，你可以在[这里下载](https://github.com/myanbin/grid)。
