---
layout: post
title: '使用 husky 和 lint-staged 检查 Node.js 的代码一致性'
tags: [code]
---

在软件开发过程中，代码风格检查（Code Linting）是保障代码规范和一致性的有效手段。过去，Lint 的工作一般在 Code Review 或者 CI 的时候进行，但这样会导致问题的反馈链，浪费不必要的时间。因此，我们需要利用 Git 的 Pre Commit 钩子，将 Lint 过程放到开发者提交代码之前。

本文将会重点介绍如何使用 [husky](https://github.com/typicode/husky) 和 [lint-staged](https://github.com/okonet/lint-staged) 来检查 Node.js 项目的代码一致性。其中 husky 用于设置本地的 Git 钩子，lint-staged 会让钩子只检查本次提交所修改的文件。


## 安装 husky 和 lint-staged

首先，我们使用下面的命令把 husky 和 lint-staged 安装到 Node.js 项目的 `devDependencies` 中：

```terminal
$ npm install husky lint-staged --save-dev
```

如果你使用的是 Yarn，请使用下面的命令

```terminal
$ yarn add husky --dev
```


## 修改 package.json 配置

将下面的代码加入 package.json文件中：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/**/*.ts": ["tslint --project . --format stylish"],
    "src/**/*.{css,scss}": ["stylelint --config src/stylelint.config.json"]
  }
}
```

这样，当在终端输入 `git commit` 命令提交代码的时候，Lint 程序便会自动检查本次提交所修改的文件是否符合本项目的代码规范。如果代码不符合规范，便会拒绝提交代码。

![使用 husky 后提交]({{site.img_url}}/2018-husky.png){:.center}


如果想要跳过 Lint 程序，可以使用 `git commit -no-verify` 进行提交。
