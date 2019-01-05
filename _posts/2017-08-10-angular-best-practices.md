---
layout: post
title: 'Angular 最佳实践'
tags: [code]
---


从去年十月份开始接触 Angular 到现在，已经有大半年的时间了，同时也见证了 Angular 的快速发展，其版本也从 Angular 2 跃升为 Angular 4。与 React、Vue 相比，Angular 框架更加严谨而全面，这使得它非常适合构建大型 Web App。然而也是因为这一点，使其学习曲线陡峭，让很多初学者望而止步。

本文将介绍在创建一个 Angular 应用中所使用的一些最佳实践。


## 一、核心概念

Angular 中最重要的三个概念是：模块、服务和组件：

* 模块：用于打包发布组件和服务
* 服务：用于添加应用逻辑
* 组件：用于管理 HTML 模板

模块是一个带有 `@NgModule` 装饰器的类。每一个 Angular 应用都有一个根模块（AppModule），根据应用规模，可能还有核心模块（CoreModule）、共享模块（SharedModule）和一些特性模块（Feature Module）。

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material.module';
// import modules, components, services here
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: [
    FlexLayoutModule,
    MaterialModule
  ]
})
export class SharedModule { }
```

上面的代码表示共享模块 SharedModule 需要：

* 导入 Angular 的 CommonModule，这样 SharedModule 就可以使用 Angular 的一些内置指令，比如 `ngIf` 等
* 导出了第三方模块 FlexLayoutModule 和 MaterialModule，这样其他特性模块只要导入 SharedModule 模块，便可以直接使用这两个第三模块

CoreModule 只能在应用启动时被 AppModule 一次性导入，所以它所提供的服务都是单例的。所以我们通常在其构造函数中进行判断：

```ts
@NgModule({
  imports: [
    CommonModule
  ],
  providers: []
})
export class CoreModule {
  // Prevent reimport of the CoreModule
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
```

服务是指用来封装按特性划分的可复用变量和函数的一个类，例如日志服务、数据服务、应用程序配置服务等。

组件是具有视图的类，它通过数据绑定的方式来负责渲染视图以及处理交互事件。设计良好的组件只负责提供用户体验的部分，其他的琐事（如从服务器获取数据、数据校验）都交给服务来做。


## 二、目录结构

Angular 官方提供一个 CLI 工具来生成、运行、测试和打包 Angular 项目。下面是一个经过实践的 Angular 项目的目录和文件结构组织方式：

```
.
├── README.md
├── angular.json
├── package.json
├── src
│   ├── app
│   │   ├── app-routing.module.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.component.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── backend
│   │   │   ├── backend-routing.module.ts
│   │   │   ├── backend.component.html
│   │   │   ├── backend.component.scss
│   │   │   ├── backend.component.spec.ts
│   │   │   ├── backend.component.ts
│   │   │   └── backend.module.ts
│   │   ├── core
│   │   │   └── core.module.ts
│   │   ├── frontend
│   │   │   ├── frontend-routing.module.ts
│   │   │   ├── frontend.module.ts
│   │   │   ├── home
│   │   │   │   ├── home-routing.module.ts
│   │   │   │   ├── home.component.html
│   │   │   │   ├── home.component.scss
│   │   │   │   ├── home.component.spec.ts
│   │   │   │   ├── home.component.ts
│   │   │   │   └── home.module.ts
│   │   │   └── profile
│   │   │       ├── profile-edit
│   │   │       │   ├── profile-edit.component.html
│   │   │       │   ├── profile-edit.component.scss
│   │   │       │   ├── profile-edit.component.spec.ts
│   │   │       │   └── profile-edit.component.ts
│   │   │       ├── profile-routing.module.ts
│   │   │       ├── profile-view
│   │   │       │   ├── profile-view.component.html
│   │   │       │   ├── profile-view.component.scss
│   │   │       │   ├── profile-view.component.spec.ts
│   │   │       │   └── profile-view.component.ts
│   │   │       └── profile.module.ts
│   │   ├── not-found.component.html
│   │   ├── not-found.component.ts
│   │   └── shared
│   │       ├── material.module.ts
│   │       └── shared.module.ts
│   ├── assets
│   ├── environments
│   │   ├── environment.prod.ts
│   │   └── environment.ts
│   ├── index.html
│   ├── karma.conf.js
│   ├── main.ts
│   ├── polyfills.ts
│   ├── stylelint.config.js
│   ├── styles.scss
│   ├── test.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.spec.json
│   └── tslint.json
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

需要在项目中创建模块、服务或组件时，推荐使用 `ng generate` 命令。比如要创建一个 ProfileViewComponent，则可以在命令行中输入：

```terminal
$ ng generate component profile-view
```

或者要创建一个带路由的模块，可以使用：

```terminal
$ ng generate module home --routing
```

## 三、路由及异步路由

在 Angular 应用中，用于配置路由信息的文件应该和其所属的模块在一起，通常有 `-routing.module.ts` 后缀。例如下面的 `profile-routing.module.ts` 用于配置 ProfileModule 的路由信息：

```ts
const routes: Routes = [
  { path: '', component: ProfileViewComponent },
  { path: 'edit', component: ProfileEditComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
```

当 Angular 应用变大之后，一次性加载所有的特性模块会导致用户访问时需要更长的时间，因此我们希望某些特性模块只在用户请求的时候才进行加载。这时我们需要配置异步路由来实现特性模块的惰性加载。

```ts
const routes: Routes = [
  { path: '', loadChildren: './frontend/frontend.module#FrontendModule' },
  { path: 'admin', loadChildren: './backend/backend.module#BackendModule' },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

```

有时候，应用需要路由守卫（Guard）来限制非授权用户访问某些目标组件或者在离开组件时询问是否保存修改。

## 四、测试

Angular 适合使用测试驱动开发（TDD）的方式进行软件开发。在使用 @angular/cli 创建的模块、服务和组件中，均会有与之同名的 `.spec.ts` 文件，测试代码写在这些文件里即可。比如下面的代码用于测试 NavigateComponent 是否显示正确的登录或注销按钮。

```ts
describe('NavigateComponent', () => {
  it('should display logout', () => {
    let compiled = fixture.debugElement.nativeElement;
    authorizationService.isLoggedIn = true;
    fixture.detectChanges();
    expect(compiled.querySelector('.nav-end').textContent).toContain('注销');
  });

  it('should display logoin', () => {
    let compiled = fixture.debugElement.nativeElement;
    authorizationService.isLoggedIn = false;
    fixture.detectChanges();
    expect(compiled.querySelector('.nav-end').textContent).toContain('登录');
  });
};
```

在对有路由模块的组件进行测试时，需要导入 RouterTestingModule：

```ts
import { RouterTestingModule } from '@angular/router/testing';

TestBed.configureTestingModule({
  imports: [RouterTestingModule],
  declarations: [AppComponent],
});
```
