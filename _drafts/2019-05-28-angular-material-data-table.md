---
layout: post
title: 'Angular Material 数据表格不完全指南'
tags: [code]
---


在 Web 应用，尤其是中后台应用中，数据表格（Data Table）是处理批量数据最有效、最常用的组件。本文将介绍 Angular Material 中数据表格的基本及进阶用法。


## 一、定义 Table 模板

我们使用下面的命令生成 UsersComponent 组件。本文中的数据表格将会在该组件内使用：

```terminal
$ ng g component users
```

以上命令会生成 UsersComponent 组件的 HTML、CSS、TypeScript 及单元测试文件。首先，在 HTML 文件中加入下面的 Table 列模板和行模板代码：

```html
<mat-table [dataSource]="dataSource">
  <!-- Define the column templates -->
  <ng-container cdkColumnDef="username">
    <mat-header-cell *cdkHeaderCellDef> User name </mat-header-cell>
    <mat-cell *cdkCellDef="let row"> {{row.username}} </mat-cell>
  </ng-container>

  <ng-container cdkColumnDef="age">
    <mat-header-cell *cdkHeaderCellDef> Age </mat-header-cell>
    <mat-cell *cdkCellDef="let row"> {{row.age}} </mat-cell>
  </ng-container>

  <ng-container cdkColumnDef="title">
    <mat-header-cell *cdkHeaderCellDef> Title </mat-header-cell>
    <mat-cell *cdkCellDef="let row"> {{row.title}} </mat-cell>
  </ng-container>

  <!-- Define the row templates -->
  <mat-header-row *cdkHeaderRowDef="['username', 'age', 'title']"></mat-header-row>
  <mat-row *cdkRowDef="let row; columns: ['username', 'age', 'title']"></mat-row>
</mat-table>
```

从上面的代码中可以看到，我们会使用 `dataSource` 属性将数据传递给 `mat-table` 组件，以便进行视图的渲染。