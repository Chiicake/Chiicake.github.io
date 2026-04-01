---
title: Axum 项目结构入门
---

## 一、接上一篇

上一篇文章里，我用一个最小的 `POST /login` 示例把 `axum` 的基本用法串了一遍。那个例子能跑，也足够用来说明路由、提取器、共享状态和响应返回这几个最基础的概念。

但只要代码再多一点，单文件写法的问题就会很快暴露出来。路由定义、请求结构体、响应结构体、共享状态和 handler 全部挤在 `main.rs` 里，虽然短期内还不至于失控，但阅读和修改的成本已经开始往上走了。

这也是这一篇要接着解决的问题：当一个最小的 `axum` 示例开始长大时，项目结构该怎么拆。

这里先把范围说清楚。这篇文章并不是在讲“大型 Rust 后端项目应该如何分层”，也不是想提前把 service、repository、domain 这些结构一次铺开。它只想回答一个更基础的问题：

> 如果手里已经有一个能跑的单文件示例，下一步最自然、也最稳妥的拆法是什么？

## 二、单文件结构的边界

单文件写法并没有错。对于入门文章、最小实验，甚至某些非常小的内部工具来说，它都是完全合理的起点。

问题在于，代码一旦继续增长，变化的方向很快就会分叉。

最先变多的通常是这些东西：

- 路由会变多；
- handler 会变多；
- 请求和响应结构体会变多；
- 应用状态会变复杂；
- 与某个具体业务有关的代码会逐渐形成小块。

当这些内容同时堆在一个文件里时，最明显的问题并不是“代码不够优雅”，而是两个更实际的结果：

第一，读代码时越来越难快速定位。你明明只是想看 `POST /login` 的 handler，最后却要在同一个文件里同时跨过启动代码、状态定义、数据结构和其他路由。

第二，改代码时越来越容易互相牵连。一个原本只想改请求结构体的动作，最后很容易变成在同一个文件里来回跳转，顺手又碰到路由、状态或者别的业务逻辑。

所以，项目结构拆分的起点并不是“为了显得正规”，而是因为代码里的变化点已经不再完全重叠了。

## 三、先拆什么

如果一上来就问“Rust 后端项目应该分成几层”，问题通常会变得过大。对入门阶段来说，更稳妥的做法是先看清楚：当前到底是哪几类东西已经值得拆开。

以 `axum` 的最小接口为例，最先值得分开的通常是这四类：

### 1. 启动代码

这一部分主要负责：

- 初始化应用状态；
- 组装路由；
- 监听端口；
- 启动服务。

这类代码的特点是：它是应用入口，但通常不应该同时承载太多具体业务细节。

### 2. 路由组织

路由定义本身是一种“入口层”代码。它最适合回答的问题是：

- 哪个路径对应哪个 handler；
- 哪些路由现在属于同一块功能；
- 应用状态在什么位置挂进来。

它不适合变成业务逻辑容器。

### 3. handler

handler 更像是 HTTP 层和业务层交界处的一层薄适配。

它通常负责：

- 接收提取器参数；
- 调用状态或后续逻辑；
- 组织响应返回。

如果 handler 写得太重，后面一旦逻辑继续增加，文件又会重新变回“什么都混在一起”。

### 4. 数据结构

请求体、响应体、业务相关的最小模型，经常会比预想中更早地增加。一开始把它们单独放出来，不只是为了好看，更是为了后面继续加校验、复用结构体或者补文档时更自然。

## 四、一个最小可维护结构

如果只是从上一篇的单文件示例往前迈一步，我比较倾向于先拆成下面这样一个很克制的结构：

```text
src/
  main.rs
  routes.rs
  state.rs
  handlers/
    mod.rs
    auth.rs
  models/
    mod.rs
    auth.rs
```

这个结构不是 `axum` 官方规定的“标准项目结构”，也不是大型项目的最终形态。它更接近一种教学型起步结构：先把最容易继续增长的几类职责拆开，让项目从“单文件能跑”过渡到“多文件但还不复杂”的状态。

每个文件的职责可以先控制得很明确：

### `main.rs`

只保留应用入口相关内容：

- 模块声明；
- 初始化状态；
- 调用顶层路由函数；
- 启动监听和服务。

### `routes.rs`

专门用来组织路由注册。

例如，它可以只做一件事：

```rust
pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/login", post(login))
        .with_state(state)
}
```

### `state.rs`

放 `AppState` 这一类应用级共享状态。

这一步的好处在于，后面如果要把演示账号换成配置对象、数据库连接池或者服务对象，这个改动就有了自然的落点。

### `handlers/auth.rs`

把认证相关的 handler 放在一起。

这时它就更像是在回答一个局部问题：与登录相关的 HTTP 入口代码放在哪里，而不是让整个应用所有 handler 都继续挤在同一个文件里。

### `models/auth.rs`

放 `LoginRequest`、`LoginResponse` 这类结构体。

这样做的意义并不只在“结构清楚”，还在于后面如果继续引入校验、文档或者更多认证相关结构时，这部分不会重新回流到 `main.rs`。

## 五、从单文件到多文件

这篇文章真正的主体，其实不是目录树，而是把上一篇那个最小登录示例，动手改成一个稍微更像样一点的项目。

先看拆分前的问题。上一篇里的单文件版本里，至少同时存在下面几类内容：

- `main` 启动函数；
- 路由定义；
- `AppState`；
- `LoginRequest` / `LoginResponse`；
- `login` handler。

对一个几十行示例来说，这当然还在可控范围内。但如果我们假设接下来继续增加：

- 注册接口；
- 用户信息接口；
- 健康检查接口；
- 更多状态字段；
- 更多请求和响应结构体；

那么这个文件很快就会同时承担过多职责。

拆分之后，更自然的状态应该是下面这样：

### `main.rs`

```rust
mod handlers;
mod models;
mod routes;
mod state;

use std::net::SocketAddr;

use tokio::net::TcpListener;

use routes::app_router;
use state::AppState;

#[tokio::main]
async fn main() {
    let state = AppState {
        username: "admin".to_string(),
        password: "123456".to_string(),
    };

    let app = app_router(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await.unwrap();

    println!("listening on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
```

这时 `main.rs` 的职责已经明显收缩了：它负责启动，而不再直接承载具体业务接口的细节。

### `state.rs`

```rust
#[derive(Clone)]
pub struct AppState {
    pub username: String,
    pub password: String,
}
```

### `models/auth.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub message: String,
}
```

### `handlers/auth.rs`

```rust
use axum::{
    extract::State,
    http::StatusCode,
    Json,
};

use crate::{
    models::auth::{LoginRequest, LoginResponse},
    state::AppState,
};

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, Json<LoginResponse>) {
    if payload.username == state.username && payload.password == state.password {
        let response = LoginResponse {
            success: true,
            message: "login success".to_string(),
        };
        return (StatusCode::OK, Json(response));
    }

    let response = LoginResponse {
        success: false,
        message: "invalid username or password".to_string(),
    };

    (StatusCode::UNAUTHORIZED, Json(response))
}
```

### `routes.rs`

```rust
use axum::{routing::post, Router};

use crate::{handlers::auth::login, state::AppState};

pub fn app_router(state: AppState) -> Router {
    Router::new().route("/login", post(login)).with_state(state)
}
```

这一轮拆分完成之后，整个项目仍然很小，但结构已经开始有了边界：

- 入口留在入口；
- 路由留在路由层；
- handler 留在 handler；
- 数据结构留在自己的文件里。

这一步的价值，不在于代码行数立刻减少，而在于后面每次继续加东西时，知道该往哪里放。

## 六、暂时不必引入的抽象

项目结构一旦开始拆，另一个很常见的问题就会出现：是不是应该顺手把 service、repository、domain、dto、controller 这些层次一次建齐。

我的建议是，入门阶段先不要这么做。

原因并不是这些结构没用，而是它们是否值得出现，取决于当前项目的复杂度。

如果只是从上一篇的最小登录示例往前走一步，那么当前更实际的目标只是：

- 不要让所有东西继续堆在 `main.rs`；
- 让路由、handler、状态和数据结构先分开；
- 给后面继续增加接口留出空间。

在这个阶段，如果过早把层次铺得很满，往往会带来两个问题：

第一，读者会误以为这是一种“标准答案”，仿佛小项目一开始就应该有完整分层；

第二，结构虽然看起来更像大项目，但很多目录暂时并没有真实职责，最后只是把原本已经不多的代码再人为摊得更散。

更稳妥的方式，是先把真正已经出现分化的职责拆开，等后面业务复杂度继续增加时，再决定要不要继续往 service 或 repository 这些层级演进。

## 结语

从单文件示例走向项目结构，真正要做的第一步，并不是把架构术语一次铺开，而是先把已经开始分化的职责拆出来。

对于 `axum` 这种入门阶段的最小项目来说，先把入口、路由、状态、handler 和数据结构拆开，通常就已经足够。这样做既能让代码更容易继续增长，也不会在还没真正需要的时候把结构做得过重。

如果后面继续往下写，这个系列里更自然的下一步，应该就是在这个结构基础上继续处理两个问题：错误怎么统一，配置怎么落地。
