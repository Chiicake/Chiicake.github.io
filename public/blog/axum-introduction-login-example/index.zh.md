---
title: Axum 入门：从路由到用户登录接口
---

## 一、开坑导言

学习 Rust 已经有一段时间了，平时也一直在用 Rust 写一些小工具和中间件，反而把后端这个老本行放下了一些。这次想做一个 Rust 后端开发的专栏，一方面算是把这条线重新捡起来，另一方面也是对费曼学习法的一个实践：把学过的内容整理出来，看看能不能对读者产生一点启发。

这个专栏叫“从入门到一般人”，没有采用更常见的“从入门到入土”或者“从入门到放弃”这种名字。倒不是说这些名字有什么问题，只是我不太想先给自己一个这样的心理暗示，还是希望能认真对待这个系列。

不过话也要说在前面。受限于我自己的能力和经验，这个专栏肯定谈不上把人带到什么很高的阶段，所以最后也只能说是“到一般人”。如果它最后能把刚接触 Rust 后端开发的读者，带到一个能够独立阅读文档、理解常见组件、写出基础服务的阶段，那我觉得这个目标就已经够具体，也够实际了。

这一篇就从 `axum` 开始。

## 二、为什么用 axum

如果已经会一点 Rust，想开始写 HTTP API，`axum` 我觉得算是一个比较直接的入口。它本身并不试图隐藏 Rust 的异步生态，而是建立在 `tokio`、`hyper` 和 `tower` 这些常见组件之上。

从入门角度看，`axum` 有一个比较明显的好处，就是它的模型相对清楚：路由负责把请求分发到处理函数，提取器负责从请求里取出 JSON、路径参数或者共享状态，处理函数再返回实现 `IntoResponse` 的结果。先把这条链路看明白，后面再去接数据库、做鉴权或者加中间件，心里会踏实一些。

这也是这一篇先从 `axum` 开始的原因。先不追求功能完整，先把最基础的使用方式理一遍。

## 三、一个最小 axum 程序长什么样

先看一个最小可运行示例：

```rust
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tokio::net::TcpListener;

async fn hello() -> &'static str {
    "hello, axum"
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(hello));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await.unwrap();

    println!("listening on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
```

这个程序里最重要的其实就四个点：

- `Router::new()` 创建一个路由容器；
- `.route("/", get(hello))` 把根路径和处理函数绑定起来；
- `TcpListener::bind` 负责监听本地端口；
- `axum::serve` 把路由和监听器接起来，开始对外提供 HTTP 服务。

如果以前写过其他语言的 Web 服务，这个结构应该不会太陌生：先定义路由，再启动服务。`axum` 比较不一样的地方在于，处理函数的参数和返回值，都会比较直接地落到 Rust 类型上。

## 四、入门必须知道的几个核心类型

这一节不打算把 `axum` 的概念一次列全，只挑写一个最小 API 时最常碰到的几个说一下。

### Router

`Router` 是整个应用的入口。可以先把它理解成“路由表 + 请求分发器”。应用里有哪些路径、每个路径对应哪个处理函数，通常都从这里开始组织。

例如：

```rust
let app = Router::new()
    .route("/", get(hello))
    .route("/login", post(login));
```

### routing::get 和 routing::post

这两个函数用来声明 HTTP 方法和处理函数之间的关系。`get(hello)` 表示这个路由只响应 `GET` 请求，`post(login)` 则表示它只响应 `POST` 请求。

这一点看起来很普通，但它和 Rust 的类型系统放在一起以后，确实有个实际的好处：路由定义、处理函数签名和返回类型会比较一致，不太容易写成“虽然能跑，但约定已经有点乱了”的状态。

### Json<T>

`Json<T>` 是 `axum` 里最常见的提取器之一。

它出现在处理函数参数里时，表示“把请求体按 JSON 解析成某个 Rust 类型”；出现在返回值里时，表示“把某个 Rust 值序列化成 JSON 响应”。

例如：

```rust
async fn create_user(Json(payload): Json<CreateUserRequest>) -> Json<CreateUserResponse> {
    // ...
}
```

这里的 `payload`，就是从请求体里解出来的结构体。

### State<T>

`State<T>` 用来从应用共享状态中取数据。比如配置、数据库连接池、缓存句柄，或者像本文后面那样，一个演示用的账号信息，都可以放在应用状态里。

它的作用是让处理函数不必依赖全局变量，而是显式地声明“我需要哪一份共享状态”。

### StatusCode

`StatusCode` 用来表达 HTTP 状态码，比如 `200 OK`、`401 Unauthorized`、`404 Not Found`。在这种简单接口里，直接把状态码写在返回值里，通常就是最直观的做法。

### IntoResponse

`IntoResponse` 是一个很重要的 trait。只要某个类型实现了它，`axum` 就能把这个值转换成 HTTP 响应。

很多常见返回值都已经实现了这个 trait，比如字符串、`Json<T>`、`StatusCode`，以及它们的组合。所以经常会看到这样的处理函数签名：

```rust
async fn handler() -> impl IntoResponse {
    "ok"
}
```

或者：

```rust
async fn handler() -> (StatusCode, Json<MyResponse>) {
    // ...
}
```

除了这些，`axum` 里还有 `Path<T>`、`Query<T>` 这类提取器，分别用来处理路径参数和查询参数。它们也很常用，不过这篇的重点是 JSON 登录接口，所以这里先不展开。

## 五、用 axum 写一个最简单的登录接口

下面写一个最小的 `POST /login` 示例。为了把重点尽量放在 `axum` 本身，这里不接数据库，也不做密码哈希，只在内存里放一个演示账号。

```rust
use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[derive(Clone)]
struct AppState {
    username: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    success: bool,
    message: String,
}

async fn login(
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

#[tokio::main]
async fn main() {
    let state = AppState {
        username: "admin".to_string(),
        password: "123456".to_string(),
    };

    let app = Router::new()
        .route("/login", post(login))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await.unwrap();

    println!("listening on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
```

如果用 `curl` 测试，成功和失败请求大概分别是这样：

```bash
curl -X POST http://127.0.0.1:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}'
```

```bash
curl -X POST http://127.0.0.1:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"wrong"}'
```

这个例子已经把一个最小 API 会碰到的几个核心问题串起来了：路由怎么定义、JSON 怎么接收、共享状态怎么传进来、响应状态码怎么返回。

## 六、拆解这个登录示例

这段代码不长，但已经把 `axum` 最基本的请求处理模型串起来了。

首先看处理函数签名：

```rust
async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, Json<LoginResponse>)
```

`State(state): State<AppState>` 的意思是，从应用共享状态里取出一个 `AppState`。这个状态是在 `Router` 上通过 `.with_state(state)` 提前挂进去的。这样处理函数就不需要自己查全局变量，也不需要手动传参。

`Json(payload): Json<LoginRequest>` 的意思是，把请求体按 JSON 解析成 `LoginRequest`。这也是为什么 `LoginRequest` 需要派生 `Deserialize`。如果客户端传来的 JSON 格式不对，或者字段缺失，`axum` 会直接返回错误响应，处理函数本身不会继续执行。

返回值 `(StatusCode, Json<LoginResponse>)` 则体现了 `IntoResponse` 的作用。这里没有手动去拼 HTTP 响应，而是直接返回一个“状态码 + JSON 数据”的组合，`axum` 会把它转换成标准 HTTP 响应。

最后是状态本身的设计。这个示例里把账号和密码直接放在 `AppState` 中，只是为了说明 `State<T>` 的基本用法。在真实项目里，这里通常会换成数据库连接池、配置对象、用户服务，或者其他更正式一些的应用级依赖。

从这个角度看，`axum` 的使用方式其实可以压缩成一句话：先在 `Router` 上组织路由和状态，再在处理函数签名里用提取器声明你要的输入，最后返回一个能转换成 HTTP 响应的结果。

## 七、后续更新计划

这个系列后面准备继续围绕 Rust 后端开发里的几个基础问题往下写。比较靠前的几个主题，大致会包括路由拆分与项目结构、配置管理与环境变量、统一错误处理、数据库访问、认证基础，以及日志和测试。

如果前面的内容能顺利写下去，希望这个专栏最后能形成一条相对平缓一点的路径：不是覆盖所有内容，而是尽量把从“刚接触”到“能独立完成基础开发任务”之间那一段路走清楚。

## 结语

这篇文章没有追求把 `axum` 讲得很全，只是先把最基础的使用模型搭起来：路由、提取器、共享状态和响应返回。对入门来说，把这几样先看明白，已经够开始写一些很小的接口了。

后面的内容如果继续展开，再在这个基础上往工程化方向慢慢推进就行。
