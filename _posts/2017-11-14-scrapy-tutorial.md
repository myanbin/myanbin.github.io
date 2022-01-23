---
layout: post
title: '爬虫框架 Scrapy 入门教程'
tags: code
---

Scrapy 是一个用 Python 开发的爬虫框架，用于抓取 Web 页面并提取其中的结构化数据。

## 一、安装

首先，确定你的电脑上已经安装了 Python 3 以及对应的 pip。可以使用下面的命令查看：

```sh
$ python3 --version
Python 3.6.3
$ pip3 --version
pip 9.0.1 from /usr/local/lib/python3.6/site-packages (python 3.6)
```

如果没有安装的话，推荐使 Homebrew 这个工具来进行安装。

pip 是 Python 的一个包管理工具，类似于 npm，可以在线安装、卸载所有的第三方 Python 模块，并自动处理依赖关系。这里我们使用下面的命令来安装 Scrapy 模块：

```sh
$ pip3 install scrapy
```

## 二、教程：一个抓取豆瓣电影 Top 250 的爬虫

首先，我们使用下面的命令来创建并初始化 Scrapy 项目：

```sh
$ scrapy startproject doubanmovie
```

这样便会在当前目录下创建一个 `doubanmovie` 的爬虫项目，其内部结构如下：

```sh
$ tree
.
├── doubanmovie
│   ├── __init__.py
│   ├── __pycache__
│   ├── items.py
│   ├── middlewares.py
│   ├── pipelines.py
│   ├── settings.py
│   └── spiders
│       ├── __init__.py
│       └── __pycache__
└── scrapy.cfg
```

其中：

* `scrapy.cfg` 为 Scrapy 项目的核心配置文件
* `items.py` 用于定义爬虫程序爬取到的数据实体的属性结构
* `piplines.py` 用于定义爬虫程序每次爬取到的数据实体进行后续处理的操作流程，比如写入文件系统或数据库
* `settings.py` 为爬虫程序的配置文件，可以在这里定义多个 pipline 和 middleware
* `spiders` 文件夹中存放爬虫文件

接着，我们需要在 `items.py` 文件中定义电影实体的属性结构：

```py
class DoubanmovieItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    rank = scrapy.Field() # 豆瓣排名
    title = scrapy.Field() # 电影名称
    poster = scrapy.Field() # 电影海报
    link = scrapy.Field() # 链接地址
    rating = scrapy.Field() # 豆瓣评分
    pass
```

然后，我们使用下面的命令来创建一个名为 doubanspider 的爬虫程序：

```sh
$ scrapy genspider moviespider douban.com
```

运行之后会在 `spiders` 目录下生成一个名为 `moviespider.py` 的爬虫文件，内部定义了爬虫的名称、作用域及起始 URL 等基本信息，以及一个解析函数，该函数的主要功能便是通过 XPath 分析页面中的 HTML 元素，并将解析结果输出：

```py
class MoviespiderSpider(scrapy.Spider):
    name = 'moviespider'
    allowed_domains = ['douban.com']
    start_urls = ['https://movie.douban.com/top250']

    def parse(self, response):
        movie_items = response.xpath('//div[@class="item"]')
        for item in movie_items:
            movie = DoubanmovieItem()

            movie['rank'] = item.xpath('div[@class="pic"]/em/text()').extract()
            movie['title'] = item.xpath('div[@class="info"]/div[@class="hd"]/a/span[@class="title"][1]/text()').extract()
            movie['poster'] = item.xpath('div[@class="pic"]/a/img/@src').extract()
            movie['link'] = item.xpath('div[@class="info"]/div[@class="hd"]/a/@href').extract()
            movie['rating'] = item.xpath('div[@class="info"]/div[@class="bd"]/div[@class="star"]/span[@class="rating_num"]/text()').extract()

            yield movie
        pass
```

通过爬虫解析后的实体数据，会通过一种 Pipeline 的过程将结果进行打印输出、存入文件或数据库等：

```py
class DoubanmoviePipeline(object):
    def process_item(self, item, spider):
        print('豆瓣排名：' + item['rank'][0])
        print('电影名称：' + item['title'][0])
        print('链接地址：' + item['link'][0])
        print('豆瓣评分：' + item['rating'][0] + '\n')

        return item
```

由于豆瓣电影的网站设置了防爬虫技术，所以在完成上述步骤后运行爬虫会出现 403 的 HTTP 状态码。于是我们需要在发送的请求中加入 User Agent 信息来伪装成一个浏览器：

```py
from scrapy.downloadermiddlewares.useragent import UserAgentMiddleware

class FakeUserAgentMiddleware(UserAgentMiddleware):
    def process_request(self, request, spider):
        request.headers.setdefault('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36')
```

最后，我们将上述修改写入配置文件：

```py
# Enable or disable downloader middlewares
# See http://scrapy.readthedocs.org/en/latest/topics/downloader-middleware.html
DOWNLOADER_MIDDLEWARES = {
    'scrapy.contrib.downloadermiddleware.useragent.UserAgentMiddleware': None,
    'doubanmovie.fakeuseragent.FakeUserAgentMiddleware': 543,
}

# Configure item pipelines
# See http://scrapy.readthedocs.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    'doubanmovie.pipelines.DoubanmoviePipeline': 300,
}
```

运行 `scrapy crawl moviespider` 命令，便会在控制台中输出爬取到的数据。

```sh
2017-12-25 22:23:40 [scrapy.core.engine] DEBUG: Crawled (200) <GET https://movie.douban.com/robots.txt> (referer: None)
2017-12-25 22:23:40 [scrapy.core.engine] DEBUG: Crawled (200) <GET https://movie.douban.com/top250> (referer: None)
豆瓣排名：1
电影名称：肖申克的救赎
链接地址：https://movie.douban.com/subject/1292052/
豆瓣评分：9.6

豆瓣排名：2
电影名称：霸王别姬
链接地址：https://movie.douban.com/subject/1291546/
豆瓣评分：9.5
...
```

至此，一个简单的豆瓣爬虫就实现了。
