---
layout: post
title: '如何开发一个 Chrome App'
tags: code
---

2008 年，Google 开发一款全新的基于 WebKit 内核的网络浏览器 Chrome，如今已经占有全球 58% 的市场份额。而运行于 Chrome 浏览器之上的 [Chrome App](https://developer.chrome.com/apps/about_apps)，是一个由 HTML、CSS 和 JavaScript 构成的应用程序，使用起来与操作系统的本地应用程序并无二致。本文通过编写一个简单的时钟应用，来讲解如何开发一个 Chrome App。

## 第一步、创建 manifest 文件

首先，需要在项目目录中新建一个 `manifest.json` 文件。manifest 文件用来告诉 Chrome 关于 App 的一些信息，比如名称、图标、如何运行以及需要的权限等。下面是一段代码示例：

~~~json
{
    "name": "My clock",
    "version": "1.0.0",
    "manifest_version": 2,
    "app": {
        "background": {
            "script": ["background.js"]
        }
    },
    "icons": {
        "512": "icons/clock-512.png",
        "256": "icons/clock-256.png",
        "128": "icons/clock-128.png"
    },
    "permissions": ["browser"]
}
~~~

关于 manifest 的更多介绍，请查看 [Manifest File Format](https://developer.chrome.com/apps/manifest)。

## 第二步、创建 background 脚本

每一个 Chrome App 都有一个不可见的 background 页，用来监听 App 的启动和退出等。

~~~js
chrome.app.runtime.onLuanched.addListener(function () {
    var screenWidth  = screen.availWidth;
    var screenHeight = screen.availHeight;
    var width  = 1024;
    var height = 768;

    chrome.app.window.create('index.html', {
        id: 'myClockID',
        outerBounds: {
            width: width,
            height: height,
            left: Math.round((screenWidth - width) / 2),
            top: Math.round((screenHeight - height) / 2)
        }
    }, function (appWindow) {
        appWindow.onClosed.addListener(function () {
            chrome.log('App is closing ..');
        });
    });
});
~~~

上面的代码表示，当用户启动 App 时，onLuanched 事件被触发，然后 Chrome 会按照给定的宽高和位置信息打开一个窗口页，并且当窗口页关闭时，调用回调函数并在终端中显示一行信息。

## 第三步、创建一个窗口页

创建 `index.html` 文件作为 App 的 window 页面，代码如下所示。需要注意的是，由于 Chrome 的安全机制，JavaScript 代码不能直接写在 HTML文件中，必须通过 `<script src="js/clock.js"></script>` 的方式引入。

~~~html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>My clock</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="clock"></div>
    <script src="js/clock.js"><script>
</body>
</html>
~~~

## 第四步、添加 CSS 样式和 JS 逻辑

为第三步中创建的 HTML 文件添加一些简单的样式：

~~~css
#clock {
    width: 600px;
    margin: 200px auto 0 auto;
    font-family: monospace;
    font-size: 42px;
    text-align: center;
}
~~~

对应的 JavaScript 代码如下：

~~~js
function myClock(el) {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    m = (m >= 10) ? m : ('0' + m);
    s = (s >= 10) ? s : ('0' + s);
    el.innerHTML = h + ": " + m + ": " + s;
    setTimeOut(function () {
        myClock(el)
    }, 500);
}

var clock = document.getElementById('clock');
myClock(clock);
~~~


## 第五步、添加应用图标

将三种不同尺寸的应用图标放入 `icons` 目录中。

## 第六步、启动运行

首先，需要打开「扩展程序」页面，确定「开发者模式」为选中状态。然后点击「加载已解压的扩展程序」，选择本项目的目录并点「确定」按钮。

当加载完成后，打开一个新标签并点击时钟应用的图标，便可以启动我们开发的 Chrome App。
