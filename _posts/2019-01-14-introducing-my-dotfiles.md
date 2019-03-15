---
layout: post
title: '介绍我的 dotfiles'
tags: [code]
---


对于常年在 Linux 或 macOS 上写代码的程序员来说，总避免不了要使用 Vim、Git、tmux 等命令行工具。同时为了让工具更加适合自己，程序员们通常会根据自己的喜好和习惯给这些工具定义一些快捷键、默认配置等。而 dotfiles 正是用来保存这些配置文件（通常是以点开头的隐藏文件，位于用户家目录 `~` 中），这样便可以在新的环境上快速还原程序员的开发环境。

本文将主要介绍我已经使用了多年的 [dotfiles](https://github.com/myanbin/dotfiles)。欢迎大家使用，如果你有什么好的建议，可以在项目中提 Issue。

## 安装 dotfiles

在类 Unix 系统上，我推荐使用 zsh 来代替默认的 bash，并且使用 [Oh My Zsh](https://github.com/robbyrussell/oh-my-zsh) 来初始化你的 zsh 环境。

首先，需要运行下面的命令来安装 dotfiles：

```terminal
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/myanbin/dotfiles/master/INSTALL.sh)"
```

这样，dotfiles 便会安装到 `~/.dotfiles` 目录中，并通过 Unix 符号链接的方式链接到 `~` 目录中。最后，将 `~/.gitconfig.local` 中的信息修改为你自己的姓名和邮箱：

```ini
[user]
  name = YOUR_NAME
  email = YOUR_EMAIL@example.com
  # signingkey = YOUR_GPG_FINGERPRINT
```

## Vim

Vim 是程序员最广泛使用的文本编辑器之一，也是我最喜欢的编辑器。我喜欢简洁流畅、不需要太多插件的 Vim，所以配置了如下的 Vim：

![Vim 使用界面]({{site.img_url}}/2019-dotfiles-vim.png){:.center}

如果想了解更多关于 Vim 的配置信息，可以查看 [dotfiles](https://github.com/myanbin/dotfiles) 中的 `.vimrc` 文件。

## Git

Git 也许是程序员们日常开发中频繁使用的工具，所以我针对 Git 的常用命令设计了一系列简洁的别名。通过一段时间的学习和适应之后，可以高效地完成常用命令的输入。具体的配置信息及解释如下：

```ini
[alias]

    a     = add
    aa    = add -A                                # Stage all changes.
    amend = commit --amend
    ap    = add -p                                # Stage changes chunk by chunk
    b     = branch -v                             # Shorthand for branch (verbose)
    ba    = branch -av
    c     = commit
    ca    = !git add -A && git commit             # Commit all changes.
    co    = checkout
    d     = diff                                  # Diff unstaged changes
    da    = diff HEAD                             # Diff unstaged and staged changes
    dc    = diff --cached                         # Diff staged changes
    ds    = diff --stat
    dw    = diff --color-words                    # Show a word diff instead a line
    dump  = cat-file -p                           # Show content of git object
    f     = fetch
    # Find commits by commit message
    find  = "!f() { git log --pretty=basic --name-status --grep=$1; }; f"
    fixup = commit --fixup
    g     = log --graph --pretty=basic            # Show basic graph.
    git   = !exec git                             # Allow `$ git git git...`
    h     = help                                  # Shorthand for help
    hi    = !echo 'hello, welcome to use myanbin/dotfiles'
    l     = log --pretty=basic                    # Show basic log. (oneline)
    ll    = log --pretty=intermediate --stat      # Show intermediate log.
    m     = merge
    new   = checkout -b                           # Create a new branch.
    p     = pull
    pick  = cherry-pick
    pop   = reset HEAD^                           # Pop your last commit out of the history
    r     = remote -v                             # Shorthand for remote (verbose)
    rc    = rebase --continue
    rs    = rebase --skip
    s     = status
    sh    = show
    type  = cat-file -t                           # Show type of git object
    undo  = reset HEAD~                           # Undo last commit, with files in uncommitted state
    who   = shortlog --no-merges --email --numbered --summary
    zip   = archive --format=zip -o latest.zip HEAD
```

如果想了解更多关于 Git 的配置信息，可以查看 [dotfiles](https://github.com/myanbin/dotfiles) 中的 `.gitconfig` 文件。

## tmux

tmux 是一个终端复用工具，用户可以通过 tmux 在一个终端内管理多个分离的会话，窗口及面板，对于同时使用多个命令行，或执行多个任务时非常方便。同时，当 SSH 连接中断后，tmux 能够保存当前会话，以便下次连接时自动恢复。

![tmux 使用界面]({{site.img_url}}/2019-dotfiles-tmux.png){:.center}


上面是我定制的 tmux 使用界面，具体配置可以查看 [dotfiles](https://github.com/myanbin/dotfiles) 中的 `.tmux.conf` 文件。


## 如何升级

我会不定期的更新我的 dotfiles 仓库，如果你也想应用这些更新的话，需要手动进行如下的操作：

```terminal
$ cd ~/.dotfiles
$ git p
```

以上操作不会覆盖 `*.local` 个性化配置文件。

## 链接

* [myanbin/dotfiles](https://github.com/myanbin/dotfiles)