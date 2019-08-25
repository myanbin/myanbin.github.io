---
layout: post
title: 'Angular Material 数据表格不完全指南'
tags: [code]
---


在 Web 应用，尤其是中后台应用中，数据表格（Data Table）是处理批量数据最有效、最常用的组件。本文将介绍 Angular Material 中数据表格的基本及进阶用法。


## 一、定义表格的模板

本文中，假设我们要实现一个展示用户列表的页面。所以首先，使用下面的命令生成 UsersComponent 组件：

```terminal
$ ng g component users
```

以上命令会生成 UsersComponent 组件的 HTML 模板、CSS 样式、TypeScript 及单元测试等四个文件。

首先，在 HTML 模板文件中加入下面的列模板和行模板代码：

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

上面的代码，定义了 Table 中的 `username`、`age` 和 `title` 三个列模板，以及包含要渲染的列数组的行模板。

从上面的代码中也可以看到，我们会使用 `dataSource` 属性将数据传递给 `mat-table` 表格组件，以便进行视图的渲染。

## 二、数据源 MatTableDataSource

Angular Material 库自带了一个 MatTableDataSource 数据源，通过它可以实现对数组型数据的分页、排序和过滤功能。

在 HTML 模板文件中，我们增加分页组件：

```html
<mat-table>
  ...
</mat-table>
<mat-paginator [pageSizeOptions]="[10, 20]" showFirstLastButtons></mat-paginator>
```

把模板中定义的 MatPaginator 提供给这个数据源，它将会自动监听用户所做的页码变更，并把正确分页之后的数据发给表格。具体代码如下：

```ts
export class UsersComponent implements OnInit {
  // 创建一个接口类型为 User 的 MatTableDataSource 数据源对象，其中 users 为数组型用户信息
  dataSource = new MatTableDataSource<User>(users);
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() {
    this.dataSource.paginator = this.paginator;
  }
}
```

这样，我们就实现一个简单的带分页的表格了。


## 三、自定义数据源

在大部分实际应用中，数据的分页和过滤一般由后端服务来实现。因此我们不能直接使用上一节中的方式来实现，而应该通过实现一个 DataSource 类来完成相应的分页、过滤和数据接受等逻辑。

DataSource 是一个拥有两个函数的基类：`connect` 和 `disconnect`。表格会调用 `connect` 函数，以接收一个流，流中会发出要渲染的数组型数据。当表格销毁时，就会调用 `disconnect`，它是清理 `connect` 期间所做的各种订阅的最佳时机。

```ts
export class UserDataSource extends DataSource<User> {
  // 用于关联分页组件
  public paginator: MatPaginator;

  private filterSubject = new BehaviorSubject<any>(null);
  private dataSubject = new BehaviorSubject<User[]>([]);
  private dataCountSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  constructor(
    private userService: UserService
  ) {
    super();
  }
  // 获取当前用户数据的长度
  get dataCount(): number {
    return this.dataCountSubject.value;
  }
  // 用于加载中动画的显示
  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get filter() {
    return this.filterSubject.value;
  }
  set filter(params: any) {
    this.filterSubject.next(params);
    this.paginator.pageIndex = 0;
  }

  loadData() {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const pageSize = this.paginator.pageSize;

    // 传入相应的参数，从后端服务中获取用户数据
    this.userService.getUsers(startIndex, pageSize, this.filter).subscribe(result => {
      this.dataSubject.next(result['data']);
      this.dataCountSubject.next(result['total']);
      this.loadingSubject.next(false);
    });
  }

  connect(): Observable<User[]> {
    return this.dataSubject.asObservable();
  }

  disconnect() {
    this.dataSubject.complete();
    this.loadingSubject.complete();
  }
}
```

在 UsersComponent 组件中，调用 `loadData` 方法即可获取用户数据，并立即更新表格视图。