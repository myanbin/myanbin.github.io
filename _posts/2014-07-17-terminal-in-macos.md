---
layout: post
title: 'Mac OS X 下终端的配置'
tags: [code]
---

工欲善其事，必先利其器，今天要讲的是日常开发中最常用到的终端的配置。以下教程会用到：

* iTerm2
* Solarized
* oh-my-zsh

## 一、使用 iTerm2 代替默认终端

都说自带的终端不好用，何不试试 [iTerm2](https://www.iterm2.com/)？

## 二、配置 iTerm2 的配色

先通过下面命令下载 Solarized 配色文件：

~~~sh
~ $ git clone git://github.com/altercation/solarized.git
~~~

然后打开 iTerm2 的偏好设置（快捷键为 <kbd>Cmd</kbd> + <kbd>,</kbd>），找到 Profiles / Colors，在最下面的 Load Presets ... / Import... 加载下载好的 iterm2-colors-solarized/Solarized Dark.itermcolors 配色方案。


![选择 iTerm2 配色方案]({{site.img_url}}/2014-iterm-preference.jpg){:.center}


## 三、安装 oh-my-zsh

Mac OS X 系统自带 zsh，可以用 `zsh --version` 命令来查看你的 zsh 版本。

oh-my-zsh 是一个被称为「终极 zsh 配置」的东西。在 iTerm2 中输入以下命令用来安装 oh-my-zsh：

~~~sh
~ $ wget --no-check-certificate http://install.ohmyz.sh -O - | sh
~~~

安装好之后，打开 Home 目录下的 `.zshrc` 文件，定位到 `ZSH_THEME="..."` 一行修改主题，oh-my-zsh 有超过一百个 zsh 默认主题（一个主题预览网站：http://zshthem.es/all/ ），选择你喜欢的主题吧。

## 四、其他配置

### 1、让 ls 显示彩色的输出

在 .zshrc 文件末尾加入下面代码：

~~~sh
export LSCOLORS=exfxcxdxbxegedabagacad
~~~

最终效果如下：


![Mac OS 下终端的最终效果]({{site.img_url}}/2014-mac-os-terminal.jpg){:.center}


### 2、iTerm2 终端常用快捷键

下面的表格是一些能够提高效率的 Shell 快捷键：

| 快捷键                          | 描述说明                                       |
| ------------------------------  | --------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>A</kbd>  | 将光标移至行首                                 |
| <kbd>Ctrl</kbd> + <kbd>E</kbd>  | 将光标移至行尾                                 |
| <kbd>Ctrl</kbd> + <kbd>B</kbd>  | 将光标向左移动一个字符                          |
| <kbd>Ctrl</kbd> + <kbd>F</kbd>  | 将光标向右移动一个字符                          |
| <kbd>Ctrl</kbd> + <kbd>K</kbd>  | 删除当前光标到行尾的字符                        |
| <kbd>Ctrl</kbd> + <kbd>U</kbd>  | 删除当前光标到行首的字符                        |
| <kbd>Ctrl</kbd> + <kbd>W</kbd>  | 向前删除一个单词                               |
| <kbd>Ctrl</kbd> + <kbd>R</kbd>  | 搜索历史命令列表                               |
| <kbd>Ctrl</kbd> + <kbd>N</kbd>  | 从历史命令列表中取下一条命令，相当于向下方向键    |
| <kbd>Ctrl</kbd> + <kbd>P</kbd>  | 从历史命令列表中取上一条命令，相当于向上方向键    |
| <kbd>Ctrl</kbd> + <kbd>L</kbd>  | 清屏                                           |
| <kbd>Ctrl</kbd> + <kbd>D</kbd>  | 关闭当前的终端会话                              |


（本文写于杭州阿里实习期间）
