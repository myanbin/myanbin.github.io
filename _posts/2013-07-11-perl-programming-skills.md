---
layout: post
title: "Perl 编程技巧"
tags: code
---


Perl 起初是由 [Larry Wall](http://www.wall.org/~larry/) 为了让在 UNIX 上进行报表处理的工作变得更加方便而设计和开发的实用摘录和报告语言（Practical Extraction and Report Language），它借鉴了 C、awk、shell 脚本以及很多其它编程语言的特性。Larry Wall 本人也是一个语言学家，他设计 perl 语言时使用了很多语言学的思维，他也经常使用语言学说明 perl 语言的架构，像“变量”和“函数”，他有时说成“名词”和“动词”。


## 一、利用注释调试：使用 Smart::Comments 模块

调试 Perl 脚本有两种方式：一种是使用 Perl 的内置调试器，另一种是在脚本中嵌入 `print` 语句。如果是第二种，大概就会了解到，像那样手工调试的最大问题是：一旦移除了 bug，就得也同时通篇移除调试语句。但是如果能将这些语句安全地留在代码里不是更好吗？毕竟很可能再此需要他们，特别是当又有 bug 出现的时候。

现在，在 Perl 里有这样一个模块：它可以利用注释来开启调试语句，这就是 Smart::Comments 模块。下面是最简单的示例，当使用 Smart::Comments 时，任何由三个或更多个 `#` 开头的注释就会变成调试语句，并会把注释的所有内容送到屏幕：

~~~perl
#!/usr/bin/perl
use Smart::Comments;

my @ipaddr = split /\./, "10.109.32.151";

### @ipaddr;
~~~

当执行这段代码后，Smart::Comments 会找到三个一组的 # 注释，并打印出它们所包含的所有内容：

~~~sh
### @ipaddr: [
###            '10',
###            '109',
###            '32',
###            '151'
###          ]
~~~

Smart::Comments 的用法不只限于打印变量值，它甚至可以在代码的循环部分用进度条的形式动态现实，更加详细的描述，请参考 perldoc 文档。


## 二、一次读入整个文件的技巧

我想你一定知道 Perl 中的钻石操作符（`<>`）。所以如果想把文件一次性读入是，应该首先修改 `$/` 变量：

~~~perl
open CONF, "<", $file;
my $text = do { local $/; <CONF> };
~~~

模块 File::Slurp 中有关于文件操作的更多方式。


## 三、封装 SQL 语句：不要直接在代码中使用 SQL 语句

对于向数据库中插入数据的操作，可以使用下面代码来实现 SQL 语句：

~~~perl
sub insert {
    my ($table, $data) = @_;

    my $sql = "insert into `$table` ";

    my $insert_fields = join ", ", map { "`$_`" } keys   %$data;
    my $insert_values = join ", ", map { "'$_'" } values %$data;

    $sql .= join " ", "(", $insert_fields, ") ";
    $sql .= join " ", "values ", "(", $insert_values, ")";

    # open a database and return $dbh
    my $sth = $dbh->prepare($sql);
    $sth->execute() or die;

    $sth->finish();
}
~~~

调用时只需要依据表名和哈希数据即可：

~~~perl
my %data = (
        name    => "Alice",
        age     => "23",
        country => "U.S.",
);
insert "student", \%data;
~~~


## 四、利用列表赋值交换两个变量的值

我们知道一般情况下如果需要交换两个变量的值，那么需要使用一个临时变量才能完成，但是在 perl 中，可以这么做：

~~~perl
my ($foo, $bar) = ("foo", "bar");
($foo, $bar) = ($bar, $foo);
~~~


## 五、Perl 中有关日期和时间的函数和用法

（未完待续）