---
layout: post
title: '使用 Draft.js 来构建一个现代化的编辑器'
tags: [code]
---

在前端，编辑器是一个非常重要的 Web 组件，任何需要编辑的地方都需要纯文本或富文本的编辑器。目前，纯文本编辑器主要依靠 HTML 的 `textarea` 标签来实现，而所见即所得的富文本编辑器由于增加了粗体、斜体等样式以及标题级别、图片视频等多媒体功能，一般通过设置 HTML 元素的 `contentEditable` 属性来实现。

本文中的主角 [Draft.js](https://draftjs.org/) 是 Facebook 发布的一个用于构建富文本编辑器的 JavaScript 框架，它基于 React 进行开发。需要注意的是，Draft.js 不是一个开箱即可用的编辑器，开发者需要对它进行进一步的编码才能使用。

本文便是介绍如何一步一步地构建一个功能丰富的编辑器，并对其原理和 API 进行相关介绍。

## 一、安装基本模块

因为 Draft.js 是基于 React 的，所以首先需要创建一个 React 的工作环境，可以使用 Facebook 官方的 [Create React App](https://github.com/facebookincubator/create-react-app) 来完成。

然后使用下面的命令将 Draft.js 添加到项目中：

```sh
npm install --save draft-js
```

至此，基本环境已经搭建完成了。


## 二、一个简单的编辑器

新建一个 React 组件，比如叫作 RichEditor，将下面代码粘贴过去：

```js
import React from 'react';
import {Editor, EditorState} from 'draft-js';

class RichEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
  }
  render() {
    return (
        <Editor editorState={this.state.editorState} onChange={this.onChange} />
    );
  }
}

export default RichEditor;
```

运行代码，就会发现页面上仅仅渲染出一个可编辑的区域，而不像传统富文本编辑器那样有工具栏等元素。这也印证了 Draft.js 是一个用于构建富文本编辑器的基础框架，具体的功能都需要开发者根据自己的项目的需求进行配置开发。


## 三、EditorState 与 ContentState

EditorState 是一个用于表示 Editor 组件的顶级（top-level）状态对象，其内容包括：

* 当前文本内容状态（ContentState）
* 当前选中内容状态（SelectionState）
* 所有的内容修饰器（Decorator）
* 撤销和重做栈
* 最后一次变更操作的类型

EditorState 有两个静态的方法用于创建一个新的对象：`createEmpty` 方法和 `createWithContent` 方法，其中 `createWithContent` 会根据传入的 ContentState 来创建对象。

EditorState 和 ContentState 都是 Immutable  的对象，所以 Draft.js 提供 `covertToRaw` 方法来将 ContentState 对象转换成 plain JavaScript 对象，从而可以以 JSON 的格式进行存取。对应的，`convertFromRaw ` 方法可以将 JSON 数据转换成 ContentState 对象。

举个例子，Draft.js 编辑器中的内容如下：

![Draft.js 富文本编辑器]({{site.img_url}}/2017-draftjs-editor.png){:.center}

那么经过 `covertToRaw` 转换的 JSON 输出有两部分组成：**blocks** 和 **entityMap**，具体结构如下：

![经过 covertToRaw 之后的编辑器内容：blocks]({{site.img_url}}/2017-draftjs-blocks.png){:.center}

blocks 是一个数组，每一项代表当前内容中的一个块级元素（比如标题、段落、列表等）。其中 text 表示该块级元素中的纯文本，type 表示该块级元素的类型（`header-one` 表示一级标题、`unstyled` 表示普通段落、`atomic` 表示多媒体类的块级元素）。

行内样式的数据存储于 inlineStyleRanges 数组中，其格式如下：

```json
{
  "inlineStyleRanges": [
    {"offset": 4, "length": 5, "style": "BOLD"},
    {"offset": 4, "length": 5, "style": "ITALIC"}
  ]
}
```

上面数据表示，本块级元素中的文本，将从第 4 个字符开始，长度为 5 的字符串分别设置为加粗和倾斜样式。在 Draft.js 模型中，对行内样式的描述数据放在一个 OrderSet 的不可变对象中，通过数组来表示每一个字符的样式。

比如对于文本 <em>Don't <strong>panic</strong></em>，对应的 OrderSet 对象是：

```
[
  ['ITALIC'],           // D
  ['ITALIC'],           // o
  ...
  ['ITALIC', 'BOLD'],   // p
  ['ITALIC', 'BOLD'],   // a
  ['ITALIC', 'BOLD'],   // n
  ...
]
```

在 Draft.js 中，超链接、图片、视频等多媒体元素的数据通过 Entity 对象来表示，而 Entity 的位置信息存储于 entityRanges 数组中，其元数据可以通过 key 值，可以在 entityMap 中索引到。

![经过 covertToRaw 之后的编辑器内容：entityMap]({{site.img_url}}/2017-draftjs-entity.png){:.center}

entityMap 用于存储 Entity 类型的元数据。在本例中，key 值为 0 的 超链接 Entity，其元数据如下：

```json
{
  "0": {
    "type": "link",
    "mutability": "MUTABLE",
    "data": {
      "description": "my blog",
      "src": "https://myanbin.github.io/"
    }
  }
}
```

## 四、使用 Entity 对象创建超链接

一个 Entity 对象表示一段文本（长度可能为 0）的元数据，所以可以用来表示超链接、图片、视频等需要额外数据项的多媒体内容。该对象有三个属性：

* 用于表示该 Entity 类型的 **type**，比如可以取值为 `link`、`image`；
* 根据 Entity 是否可变，**mutability** 具有三种取值：`IMMUTABLE`、`MUTABLE` 和 `SEGMENTED`;
* 用于存储 Entity 元数据的 **data** 字段，比如对于超链接 Entity，应该有一个 href 值；

下面代码描述了如何创建一个超链接 Entity，并根据生成的 key 更新 EditorState 对象：

```js
const contentState = editorState.getCurrentContent();
const contentStateWithEntity = contentState.createEntity(
  'LINK',
  'MUTABLE',
  {url: 'https://myanbin.github.io/'}
);
const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
RichUtils.toggleLink(newEditorState, newEditorState.getSelection(), entityKey);
```

下面代码描述了如何根据 key，从 ContentState 对象中取出 Entity 元数据：

```js
const blockWithLinkAtBeginning = contentState.getBlockForKey('...');
const linkKey = blockWithLinkAtBeginning.getEntityAt(0);
const contentState = editorState.getCurrentContent();
const linkInstance = contentState.getEntity(linkKey);
const {url} = linkInstance.getData();
```


## 五、装饰器 Decorator

Draft.js 使用 `blockRendererFn` 来渲染块级元素组件，对于行内元素组件的渲染，则使用装饰器 Decorator 来完成。比如对于上面的超链接元素，则需要如下的代码将其渲染成一个 Link 组件：

```js
const decorator = new CompositeDecorator([
  {
    strategy: (contentBlock, callback, contentState) => {
      contentBlock.findEntityRanges(
        (character) => {
          const entityKey = character.getEntity();
          return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'LINK'
          );
        },
        callback
      );
    },
    component: Link,
  },
]);
```

与 `blockRendererFn` 渲染整个块级元素不同，Decorator 使用一个 Strategy 函数，来查找块级元素内符合要求的文本并进行渲染。


## 六、自定义快捷键

Draft.js 默认提供了一系列常用快捷键，比如 `Ctrl + Z` 是撤销、`Ctrl + B` 是加粗，另外开发者也可以自定义快捷键来实现个性化的功能。比如下面的代码中，实现了两个自定义的命令 save 和 insert-link：

```js
const myKeyBindingFn = (e) => {
  if (e.keyCode === 83 /* `S` key */ && KeyBindingUtil.hasCommandModifier(e)) {
    return 'save';
  } else if (e.keyCode === 75 /* `K` key */ && KeyBindingUtil.hasCommandModifier(e)) {
    return 'insert-link';
  }
  return getDefaultKeyBinding(e);
}

handleKeyCommand(command) {
    const { editorState } = this.state;
    if (command === 'save') {
      console.log(convertToRaw(editorState.getCurrentContent()));
    } else if (command === 'insert-link') {
      this.insertLink();
    }

    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }
```

其中 `myKeyBindingFn` 用于检测键盘按键并返回相应命令，`handleKeyCommand` 用于处理相应的命令。


## 七、源代码

我实现了一个简单的 Demo，并把源码放到了 GitHub 上，你可以在[这里下载](https://github.com/myanbin/myeditor)。