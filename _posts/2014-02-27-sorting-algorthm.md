---
layout: post
title: '几种常见排序算法的总结'
tags: coding
---

排序算法是计算机科学中最常见的一类算法，也是程序员在求职面试时最经常会被问到的。所以本文中，将会对几种常见的排序算法进行简单的介绍和分析。


## 一、插入排序

插入排序（Insertion Sort）由 `N-1` 趟排序组成。对于 `p = 1` 趟到 `p = N-1` 趟，插入排序保证从位置 `0` 到位置 `p` 上的元素为已排序状态。下面的程序中，位置 `p` 上的元素存于 `tmp`，而在位置 `p` 之前所有更大的元素都被向右移动一个位置，最后 `tmp` 被正确放在的位置上。

下面的 C 代码是参考《编程珠玑》而对交换操作进行优化过的：

~~~c
void insertion_sort (int d[], int N)
{
    int j, p;

    int tmp;
    for (p = 1; p < N; p++)
    {
        tmp = d[p];
        for (j = p; j > 0 && tmp < d[j-1]; j--)
            d[j] = d[j-1];
        d[j] = tmp;
    }
}
~~~


## 二、冒泡排序

冒泡排序的基本思路是：对待排元素进行 N 趟操作，在每一趟中使一个最大的元素冒至数组的尾端。下面是冒泡排序最原始的一个代码：

~~~c
void bubble_sort (int d[], int N)
{
    int i, j;
    int tmp;

    for (i = 0; i < N; i++)
        for (j = 0; j < N - i; j++)
            if (d[j] > d[j+1])
            {
                tmp = d[j];  d[j] = d[j+1];  d[j+1] = tmp;
            }
}
~~~

可以看出，无论对于什么样的数组（甚至是本来就是按序排列的），上面的程序仍旧需要将每趟进行到底。所以下面的代码中使用了标志变量 `FLAG` 记录每趟中最后发生交换的位置，来避免多余的遍历和比较。

~~~c
void bubble_sort (int d[], int N)
{
    int i, bound, FLAG = N;
    int tmp;

    while (FLAG > 0)
    {
        bound = FLAG;
        FLAG = 0;
        for (i = 1; i < bound; i++)
            if (d[i-1] > d[i])
            {
                tmp = d[i-1];  d[i-1] = d[i];  d[i] = tmp;
                FLAG = i;
            }
    }
}
~~~


## 三、希尔排序

希尔排序（Shell Sort）又叫缩小增量排序，它通过比较相距一定间隔的元素来工作，各趟比较所用的距离随着算法的进行而较小，知道之比较相邻元素的最后一趟排序为止。希尔排序是冲破二次时间屏障的第一批算法之一。

~~~c
void shell_sort (int d[], int N)
{
    int i, j, increment;

    for (increment = N / 2; increment > 0; increment =/ 2)
        for (i = increment; i < N; i++)
        {
            tmp = d[i];
            for (j = i; j >= increment; j -= increment)
                if (tmp < d[j-increment])
                    d[j] = d[j-increment];;
                else
                    break;
            d[j] = tmp;
        }
}
~~~


## 四、快速排序

快速排序是一种分治的递归算法，它也是最快的已知排序算法。算法主要由下列步骤组成：

1. 从数列中挑出一个元素，称为基准（pivot）；
2. 重新排序数列，所有元素比基准值小的摆放在基准前面，所有元素比基准值大的摆在基准的后面（相同的数可以到任一边）。在这个分区退出之后，该基准就处于数列的中间位置。这个称为分区（partition）操作；
3. 递归地把小于基准值元素的子数列和大于基准值元素的子数列排序。

下面的代码是使用<abbr title="代码中的变量 i 和变量 j">双向划分</abbr>的快速排序，思路同样参考自《编程珠玑》：

~~~c
void quick_sort (int data[], int left, int right)
{
    if (left >= right)
        return;
    int pivot = data[left];
    int i = left, j = right + 1;
    int temp;
    while (1)
    {
        do i++; while (i <= right && data[i] < pivot);
        do j--; while (data[j] > pivot);
        if (i > j)
            break;
        temp = data[i];  data[i] = data[j];  data[j] = temp;
    }
    temp = data[left];  data[left] = data[j];  data[j] = temp;
    quick_sort(data, left, j - 1);
    quick_sort(data, j + 1, right);
}
~~~

在递归的过程中，快速排序对于很小的子数组将花费大量的时间进行运算。这个时候可以使用插入排序之类的简单方法来排序这些很小的数组，程序的速度会更快。将上面快速排序代码中的第一个 `if` 语句改为

~~~c
if (right - left < cutoff)
    return;
~~~

其中 `cutoff` 是一个小整数。程序结束时，数组并不是有序的，而是被组合成一块一块随机排列的值，并且满足这样的条件：某一块中的元素小于它右边任何块中的元素。我们需要通过另一种排序算法对块的内部进行排序：

~~~c
quick_sort(data, 0, n);
insertion_sort(data, n);
~~~
