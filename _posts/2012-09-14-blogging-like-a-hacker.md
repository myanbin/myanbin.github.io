---
layout: post
title: "像黑客一样写博客"
tags: code
---


上大学之后，发现了刘未鹏、阮一峰等人的博客后，我也梦想有一个自己的博客，来记录自己成长和心路历程。最早是从 CSDN、博客园等网站开通博客，到后来开始用 Wordpress 自己搭建。

这其间，我在寻求一种写博客的最佳体验。我厌倦了复杂的博客系统，只需要一个容易维护的博客程序，而能够专注于写作。就在一个月前，我了解到 [Jekyll](https://jekyllrb.com)，于是打算重新设计我的博客。而今天，这个博客终于问世了。


Jekyll 是用 Ruby 开发的一个静态站点生成器，它会根据网页源码生成静态文件。它提供了模板、变量、插件等功能，所以实际上可以用来编写整个网站。只需要使用下面的几行命令，就可以在本地生成一个博客：


```sh
[ybm@localhost ~]$ gem install jekyll
[ybm@localhost ~]$ jekyll new myblog
[ybm@localhost ~]$ cd myblog
[ybm@localhost myblog]$ jekyll server
# => Now browse to http://localhost:4000
```

最后，利用 GitHub Page，将博客源代码部署到 GitHub 上去，便可以得到一个使用版本控制，可以在本地用 [Markdown](http://wowubuntu.com/markdown/basic.html) 写作的简单快速的静态博客系统了。
