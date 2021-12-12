---
layout: page
title: "友链"
permalink: links.html
index: 3
---

海内存知己，天涯若比邻。欢迎各位看官来与我为友，您的链接也会显示在本页。此外，我会不定期访问所有友链，并按照个人喜好，选出最有价值友链 MVL 若干，并在此公示。点击此处以[申请友链](https://github.com/myanbin/talk/issues/new?assignees=&labels=apply&template=apply-link.md&title=) ✍️
{:.message}

## 最有价值友链

<section class="most-valuable-link">
  {% for link in site.data.links['one'] %}
  <a class="mvl-link" href="{{link.url}}">
    <img src="{{link.avatar}}">
    <h4>{{link.name}}</h4>
    <div>{{link.desc}}</div>
  </a>
  {% endfor %}
</section>

## 其他友链

{% for link in site.data.links['two'] %}
* [{{link.name}}]({{link.url}})
{% endfor %}
