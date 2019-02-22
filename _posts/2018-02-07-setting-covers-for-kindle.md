---
layout: post
title: '两种方法来给 Kindle 设置图书封面'
tags: [read]
---

对于一个完美主义者（或者可以说是强迫症患者）来说，Kindle 上缺少了封面的电子书是无法忍受的。不幸的是，我就属于这一类人。

所以，让我们来谈谈如何给 Kindle 电子书设置封面图片。

## 一、使用 calibre 设置封面图

第一种方法是使用 calibre。calibre 是一个开源的电子书管理工具，可以用来编辑、阅读和转换多种格式的电子书。下图是其主界面 UI：

![calibre E-Book management]({{site.img_url}}/2018-calibre.png){:.center}

用 calibre 来设置书籍的封面图是极其简单的：只需要选中一本书，然后点击工具栏上的“编辑元数据”按钮，然后在弹出的窗口中选择“更换封面”，最后保存即可。

使用 calibre 发送到 Kindle 设备上的电子书，便会带上刚才设置的封面。

## 二、手动设置

如果使用 calibre 设置后，Kindle 仍然无法显示封面图，则可以考虑采用下面的方法来手动设置。

Kindle 系统中的所有书籍封面会保存在 `kindle/system/thumbnails` 目录下，如下图所示：

![Kindle 书籍封面所在目录]({{site.img_url}}/2018-kindle-thumbnails.png){:.center}

其中文件的命名规则是 <span style="font-weight: bold; font-family: 'Source Code Pro', 'Andale Mono', Consolas, monospace">thumbnail_XXXXXXXXXX_EBOK_portrait.jpg</span>，其中 10 位编码的占位符表示该书在亚马逊网站上的 ASIN 编号。比如我们想设置《你一定爱读的极简欧洲史》这本书的封面，则可以在亚马逊官网上找到该书的[详情页面](https://www.amazon.cn/dp/B00E192518/)，同时便可在地址栏 URL 中找到类似 `B00E192518` 的编码。

最后把找到的封面图片保存到 `kindle/system/thumbnails` 目录下，便完成了封面图的设置。

-----

在本文的最后，我来强烈安利一个 Kindle 漫画推送和下载网站 [vol.moe](https://vol.moe)。这是一个由香港网友维护的漫画站，内容涵盖几乎所有的经典及热门漫画。在 PC 端注册账号之后，使用 Kindle 内置浏览器访问 vol.moe，登录后即可下载高质量的漫画资源了。