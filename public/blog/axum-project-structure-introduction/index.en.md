---
title: Axum Project Structure Introduction
---

## 1. Continuing from the previous article

In the previous article, I used a minimal `POST /login` example to explain the basic usage model of `axum`. That example was enough to show routing, extractors, shared state, and response handling.

But once the code grows even a little, the limits of a single-file layout appear quickly. Route definitions, request structs, response structs, shared state, and handlers all sit in `main.rs`. That is still manageable for a small demo, but both reading and editing costs start to rise.

This article addresses the next step: how to split an `axum` example once it begins to grow.

The scope here is intentionally narrow. This is not an article about large-scale Rust backend layering. It is not trying to introduce service, repository, and domain layers all at once. It only answers a more basic question:

> If you already have a working single-file example, what is the most natural next split?

## 2. The limits of a single-file layout

There is nothing inherently wrong with a single-file layout. For an introductory article, a small experiment, or even some tiny internal tools, it is a perfectly reasonable starting point.

The problem is that code growth quickly branches in different directions.

The first things that usually grow are:

- more routes,
- more handlers,
- more request and response structs,
- more application state,
- and more business-specific code.

Once all of these accumulate in one file, the main issue is not aesthetics. It is practical cost.

First, it becomes harder to locate things quickly. You may only want to inspect the `POST /login` handler, but you have to scroll past startup code, state definitions, request types, response types, and unrelated routes.

Second, edits begin to interfere with one another. A small change to a request struct can easily turn into a back-and-forth across startup, routing, state, and handler code.

That is why project structure splitting should not start from “how do I make this look more formal?” It should start from a simpler observation: different kinds of changes are no longer happening in the same place.

## 3. What to split first

For an introductory `axum` project, the first useful split is usually across these responsibilities:

### Startup code

This part is mainly responsible for:

- initializing application state,
- assembling routes,
- binding to an address,
- and starting the server.

It is the application entry point, but it does not need to carry much business-specific detail.

### Route organization

Route definitions are entry-layer code. They answer questions such as:

- which path maps to which handler,
- which routes belong to the same feature area,
- and where shared state is attached.

They do not need to become a container for business logic.

### Handlers

Handlers sit at the boundary between HTTP input and application behavior.

They usually:

- receive extractor arguments,
- call into state or other logic,
- and construct responses.

If handlers become too heavy, files quickly slide back toward the same “everything in one place” problem.

### Data structures

Request types, response types, and small feature-specific models usually grow earlier than expected. Pulling them out early makes later validation, reuse, and documentation much easier.

## 4. A minimal maintainable structure

If the goal is simply to move one step beyond the previous single-file example, a restrained structure like this is usually enough:

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

This is not an official `axum` project structure, and it is not the final form of a larger application. It is better understood as a teaching-oriented starting point.

Each file can keep a clear responsibility:

- `main.rs`: startup and server bootstrapping
- `routes.rs`: route assembly
- `state.rs`: shared application state
- `handlers/auth.rs`: authentication-related handlers
- `models/auth.rs`: request and response structs for authentication

## 5. From one file to multiple files

The real point of this article is not the directory tree itself. It is the act of taking the previous login example and splitting it into a structure that can keep growing.

Before the split, the single-file version contains all of the following in one place:

- `main`
- route definitions
- `AppState`
- `LoginRequest` and `LoginResponse`
- the `login` handler

That is still acceptable for a short example. But as soon as you imagine adding registration, user info endpoints, health checks, more state fields, or more request and response types, the file is already doing too much.

After the split, the project becomes much easier to read:

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

At this point, the project is still small, but the structure already has boundaries:

- startup remains in startup,
- routes remain in route assembly,
- handlers remain in handlers,
- and data types remain in their own files.

The value is not immediate line-count reduction. The value is that the next change now has a natural place to go.

## 6. Abstractions that can wait

Once the project starts splitting, another question appears quickly: should service, repository, domain, DTO, and controller layers also be introduced right away?

My suggestion is no, at least not yet.

The reason is not that those structures are useless. The reason is that whether they are worth introducing depends on the actual complexity of the project.

At this stage, the practical goal is still simple:

- stop putting everything into `main.rs`,
- separate routes, handlers, state, and data structures,
- and leave room for more endpoints later.

If the structure becomes too elaborate too early, two things usually happen:

- readers start treating it as a “standard answer,”
- and the code becomes more scattered without yet gaining real modular value.

It is usually better to separate only the responsibilities that have already started to diverge, then add more layers later if the application truly needs them.

## Conclusion

Moving from a single-file example to a project structure does not begin with architecture terminology. It begins with separating the responsibilities that have already started to diverge.

For a small introductory `axum` project, separating startup, routes, state, handlers, and data structures is usually enough. It makes the code easier to grow without making the structure heavier than the project actually requires.

The next natural topics after this point would be error handling and configuration, both of which become much easier to explain once this structure is already in place.
