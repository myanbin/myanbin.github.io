---
layout: post
title: '使用 CNPM 搭建私有 npm 仓库'
tags: [code]
---

CNPM 是一个可以提供 npm 私有化部署的开源方案。它提供了 JavaScript 模块的存储、发布和下载，以及一个用于在线浏览的 Web 界面。

![CNPM 示意图]({{site.img_url}}/2018-cnpm-architecture.png){:.center}

## 为什么需要私有 npm

官方的 [npm](https://www.npmjs.com/) 可以说是最大的 JavaScript 模块仓库，大约有 60 多万个开源的 JavaScript 模块。那为什么我们还需要一个私有 npm 仓库呢？

总结起来，有以下几点原因：

1. 保证 npm 服务的快速、稳定。由于国内网络环境的原因，从官方 npm 上安装模块依赖时，可能需要花费很长的时间。在部署私有 npm 后，可以把经过审核的 npm 模块加入到私有仓库，这样在开发环境和生产环境中就可以对模块进行快速安装了。另外还能避免类似 left-pad 事件的发生[^1]。
2. 发布私有 npm 模块。官方 npm 上的模块全部是开源的，然而在实际开发过程中，我们需要将一些可复用的功能封装成模块供团队内部使用，而又不希望公布并上传到官方的 npm。


## 快速部署 CNPM

首先从 GitHub 上将源代码下载到本地：

```terminal
$ git clone https://github.com/cnpm/cnpmjs.org.git $HOME/cnpmjs.org
```

创建一个 MySQL 数据库实例，并将 CNPM 源码中的 SQL 导入：

```terminal
mysql> create database cnpmjs;
mysql> use cnpmjs;
mysql> source ./docs/db.sql;
```

然后新建 `config/config.js` 文件，并将下面的配置信息写入：

```js
module.exports = {
  debug: false,
  enableCluster: true, // enable cluster mode
  enablePrivate: true, // enable private mode, only admin can publish, other use just can sync package from source npm
  database: {
    db: 'cnpmjs',
    host: 'localhost',
    port: 3306,
    username: 'cnpmjs',
    password: 'password'
  },
  admins: {
    admin: 'admin@cnpmjs.org',
  },
  syncModel: 'exist' // 'none', 'all', 'exist'
};
```

使用下面的命令来安装相关依赖：

```terminal
$ npm install --build-from-source
```

启动服务：

```terminal
$ npm run start
```

最后，可以通过 `http://localhost:7001` 访问 Registry 仓库，以及 `http://localhost:7002` 访问到 Web 页面。

## 如何使用 CNPM

为了避免与官方的 npm 冲突，我们需要安装 cnpm 来使用本地的 npm 仓库，并将其源设置为私有 npm 仓库：

```terminal
$ npm intsall -g cnpm
$ cnpm config set registry https://registry.npm.xinhua.io
```

假设我们想把一个 JavaScript 模块发布到这个私有 npm 仓库，则可以在该模块目录下使用如下命令：

```terminal
# make sure you have login cnpm
$ cnpm publish
```

便将这个模块发布到了我们的私有 npm 上了。


[^1]: left-pad 事件是指一个叫做 Azer 的开发者因为 npm 公司把本来他持有的 kik 包名字转移给了 kik 公司，一怒之下 unpublish 了他的所有包。其中一个叫 left-pad 的包，被 babel、react native 等依赖，于是它们就安装失败了，进而所有依赖它们的应用也都会安装和构建失败。