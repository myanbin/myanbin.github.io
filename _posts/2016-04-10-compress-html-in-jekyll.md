---
layout: post
title: '压缩 Jekyll 中的 HTML 和 CSS 代码'
tags: coding
---

几年前，[@mdo](http://markdotto.com/) 开发了 Jekyll，如今已经成为最流行的静态博客网站生成器。我从 2012 年开始使用 GitHub Pages 和 Jekyll 搭建博客，最近在修改主题的时候，计划对网页代码进行优化。所以有了此文记录。


## 一、压缩 HTML 代码

[jekyll-compress-html](https://github.com/penibelst/jekyll-compress-html) 是一个使用 Jekyll layout 进行代码压缩的工具，意味着使用者不需要安装任何插件即可将站点部署到 GitHub Pages 上。

使用起来也很方便：下载 `compress.html` 文件并保存到 `_layouts`，然后修改顶层 layout 文件（比如 `_layouts/default.html`），把它引用进去：

~~~yaml
---
layout: compress
---
~~~

最后，在 `_config.yml` 中配置相应的压缩选项，比如我的：

~~~yaml
compress_html:
  clippings:      all
  comments:       ["<!--", "-->"]
  endings:        all
  startings:      [html, head, body]
~~~

详细的配置文档可以在[官方网站](http://jch.penibelst.de/)上找到。


## 二、压缩 CSS 代码

Jekyll 原生支持 Sass，所以我决定使用 SASS 进行 CSS 文件的合并和压缩。

### 1、修改 Sass 配置

因为我的 CSS 文件全部在 `public/css` 目录下，所以首先需要在 `_config.yml` 中配置 Sass 目录来代替默认的 `_sass`；同时配置 `style` 选项，使得最后输出结果是压缩格式的：

~~~yaml
sass:
  sass_dir:       /public/css
  style:          compressed
~~~

### 2、创建 Sass 样式文件

将当前 `public/css` 目录中的所有 CSS 文件后缀改为 `.scss`，并新建文件 `styles.scss`，用于将其他 Sass 文件合并到一起：

~~~sh
myblog
├── _includes
├── _layouts
├── _posts
├─┬ public
│ └─┬ css
│   ├── highlight.scss
│   ├── hyde.scss
│   ├── poole.scss
│   └── styles.scss
├── _config.yml
└── index.html
~~~


在 `styles.scss`， 中，使用 `@import` 语句导入其他的 Sass 文件，这样最终 Jekyll 在编译 Sass 的时候便会将其合并为一个 CSS 文件。注意，需要在文件顶部加入 [Front Matter](https://jekyllrb.com/docs/frontmatter/) 块，否则会报错：

~~~sass
---
# Front matter comment to ensure Jekyll properly reads file.
---

@charset "utf-8";
// Imports sass/scss files
@import "poole";
@import "hyde";
@import "highlight";
~~~

### 3、引入编译后的样式文件

最后，在 HTML layout 的 `<head>` 标签中引入编译后的样式文件。Jekyll 会自动将 `.scss` 文件转化为相应的 `.css` 文件，所以这里只需要引入 CSS 文件即可：

~~~html
<link rel="stylesheet" href="/public/css/styles.css">
~~~


最后，优化之后的代码，可以右键查看本页的源代码进行查看。
