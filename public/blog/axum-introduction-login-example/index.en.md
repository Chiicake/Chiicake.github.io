---
title: Axum Introduction: From Routing to a User Login Endpoint
---

## 1. Why start this series

I have been learning Rust for a while now. Most of the time I have been using it to write small tools and bits of middleware, and in the process I have let my old backend work drift a little further away than I expected.

So this series on Rust backend development is, in part, a way to pick that line of work up again. It is also a small practice of the Feynman technique: organize what I have been learning, write it down, and see whether it can be of some use to other readers.

The series is called "From Beginner to Practitioner". I did not want to use a more playful title. I would rather treat the series seriously. At the same time, I should keep the scope modest. Given my own limits, it would be unrealistic to promise anything more ambitious. If this series can help a reader who is just getting started with Rust backend development reach the point where they can read documentation, understand common building blocks, and write basic services on their own, that is already a concrete and worthwhile goal.

This article starts with `axum`.

## 2. Why axum

If you already know a little Rust and want to build HTTP APIs, `axum` is a fairly direct place to begin. It does not try to hide the async Rust ecosystem. Instead, it sits on top of common components such as `tokio`, `hyper`, and `tower`.

From a beginner's perspective, one advantage of `axum` is that its model is easy to follow: routes dispatch requests to handlers, extractors pull JSON, path parameters, or shared state out of the request, and handlers return values that implement `IntoResponse`. Once that flow is clear, it becomes much easier to extend the application with a database, authentication, or middleware later.

That is the reason for choosing `axum` here. The point of this article is not completeness. It is to make the basic usage model clear first.

## 3. What does the smallest axum program look like

Here is a minimal runnable example:

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

There are only four key pieces here:

- `Router::new()` creates a routing container.
- `.route("/", get(hello))` connects a path to a handler.
- `TcpListener::bind` listens on a local address.
- `axum::serve` connects the listener to the router and starts serving HTTP traffic.

If you have written web services in other languages before, this shape should feel familiar. Define routes first, then start the server. The main difference in `axum` is that handler inputs and outputs are expressed directly through Rust types.

## 4. A few core types you need first

This is not a complete list of `axum` concepts. It only covers the ones you are most likely to touch in a very small API.

### Router

`Router` is the entry point of the application. You can think of it as a route table plus a request dispatcher. The paths in your application and the handlers behind them are usually organized here.

```rust
let app = Router::new()
    .route("/", get(hello))
    .route("/login", post(login));
```

### routing::get and routing::post

These functions bind an HTTP method to a handler. `get(hello)` means the route only accepts `GET`, while `post(login)` means it only accepts `POST`.

### Json<T>

`Json<T>` is one of the most common extractors in `axum`.

When it appears in a handler parameter, it means "parse the request body as JSON into a Rust type". When it appears in a return value, it means "serialize a Rust value as a JSON response".

```rust
async fn create_user(Json(payload): Json<CreateUserRequest>) -> Json<CreateUserResponse> {
    // ...
}
```

### State<T>

`State<T>` is used to read shared application state. That state may contain configuration, a database pool, cache handles, or, as in this article, a small demo account.

It helps handlers declare their dependencies explicitly instead of relying on globals.

### StatusCode

`StatusCode` represents HTTP status codes such as `200 OK`, `401 Unauthorized`, and `404 Not Found`. For small examples, returning a status code directly is often the clearest approach.

### IntoResponse

`IntoResponse` is a central trait in `axum`. If a type implements it, `axum` can turn that value into an HTTP response.

That is why simple handlers can return strings, `Json<T>`, status codes, or combinations of them.

```rust
async fn handler() -> impl IntoResponse {
    "ok"
}
```

```rust
async fn handler() -> (StatusCode, Json<MyResponse>) {
    // ...
}
```

There are other common extractors such as `Path<T>` and `Query<T>`, but this article focuses on a JSON login endpoint, so I will leave them aside for now.

## 5. A minimal login endpoint in axum

Now let's write a minimal `POST /login` example. To keep the focus on `axum`, this example does not use a database or password hashing. It only stores one demo account in memory.

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

If you test it with `curl`, success and failure look like this:

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

Even this small example already covers the core questions behind a minimal API: how to define a route, how to receive JSON, how to pass shared state, and how to return an HTTP status plus a JSON body.

## 6. Breaking the example down

The code is short, but it already shows the basic request handling model in `axum`.

Start with the handler signature:

```rust
async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, Json<LoginResponse>)
```

`State(state): State<AppState>` means: read `AppState` from shared application state. That state was attached to the router earlier with `.with_state(state)`. The handler does not need global variables or manual dependency passing.

`Json(payload): Json<LoginRequest>` means: parse the request body as JSON into `LoginRequest`. That is why `LoginRequest` derives `Deserialize`. If the incoming JSON is malformed or missing fields, `axum` returns an error response before the handler continues.

The return value `(StatusCode, Json<LoginResponse>)` shows how `IntoResponse` works in practice. We do not build an HTTP response manually. We simply return a pair of values that `axum` already knows how to convert into a response.

Finally, the state design itself is intentionally minimal. Storing the username and password directly in `AppState` is only meant to demonstrate how `State<T>` works. In a real application, this would usually become a database pool, a configuration object, or a user service.

At a high level, that is the basic shape of using `axum`: organize routes and state on the `Router`, declare handler inputs through extractors, and return a value that can become an HTTP response.

## 7. What I plan to write next

This series will continue with a few basic backend topics in Rust. The next topics will likely include route splitting and project structure, configuration and environment variables, unified error handling, database access, authentication basics, and logging and tests.

If the series develops well, I hope it can form a relatively smooth path. Not a complete map of everything, but a practical route through the stage between "just started" and "can build basic backend services independently".

## Conclusion

This article does not try to cover all of `axum`. It only sets up the basic usage model first: routing, extractors, shared state, and response handling. For beginners, understanding these pieces is already enough to start writing very small APIs.

The later articles can build on top of this and move step by step toward more complete backend practice.
