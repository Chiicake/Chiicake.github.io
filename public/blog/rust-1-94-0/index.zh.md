---
title: Rust 1.94.0 发布
---
原文链接：[Announcing Rust 1.94.0](https://blog.rust-lang.org/2026/03/05/Rust-1.94.0/)

Rust 团队很高兴宣布 Rust 1.94.0 正式发布。Rust 是一门致力于让每个人都能构建可靠且高效软件的编程语言。

如果你已经通过 `rustup` 安装过 Rust 旧版本，可以用下面的命令升级到 1.94.0：

```bash
rustup update stable
```

如果你还没有安装，可以前往官网获取 [`rustup`](https://www.rust-lang.org/tools/install)，同时也可以查看 [Rust 1.94.0 的详细发布说明](https://doc.rust-lang.org/stable/releases.html#version-1940-2026-03-05)。

如果你希望帮助测试后续版本，也可以考虑把本地工具链切换到 beta 渠道（`rustup default beta`）或 nightly 渠道（`rustup default nightly`）。如果遇到问题，请及时[反馈](https://github.com/rust-lang/rust/issues/new/choose)。

## Rust 1.94.0 稳定版包含了什么

### `array_windows`

Rust 1.94 新增了 [`array_windows`](https://doc.rust-lang.org/stable/std/primitive.slice.html#method.array_windows) 这个切片迭代方法。它的行为和 [`windows`](https://doc.rust-lang.org/stable/std/primitive.slice.html#method.windows) 很像，但窗口长度是编译期常量，因此迭代项是 `&[T; N]`，而不是动态大小的 `&[T]`。在很多情况下，窗口长度甚至可以通过迭代器的使用方式直接推导出来。

例如，在 [2016 Advent of Code](https://adventofcode.com/2016/day/7) 的一道题里，需要查找 ABBA 模式，也就是“两种不同字符，后面紧跟着它们的逆序组合”，如 `xyyx` 或 `abba`。如果只考虑 ASCII 字符，可以像下面这样在字节切片上滑动窗口：

```rust
fn has_abba(s: &str) -> bool {
    s.as_bytes()
        .array_windows()
        .any(|[a1, b1, b2, a2]| (a1 != b1) && (a1 == a2) && (b1 == b2))
}
```

闭包参数里这种解构写法会让编译器自动推导出我们想要的是长度为 4 的窗口。如果这里用的是旧的 `.windows(4)`，那么闭包参数拿到的会是一个切片，你就必须手动索引，并寄希望于运行时边界检查最终能被优化掉。

### Cargo 配置支持 `include`

Cargo 现在支持在配置文件（`.cargo/config.toml`）中使用 `include` 键，从而让 Cargo 配置在跨项目、跨环境时更容易组织、共享和管理。这些被包含的路径也可以标记为 `optional`，以适应某些仅在特定开发者本地环境中才存在的配置。

```toml
# array of paths
include = [
    "frodo.toml",
    "samwise.toml",
]

# inline tables for more control
include = [
    { path = "required.toml" },
    { path = "optional.toml", optional = true },
]
```

更多细节可以参考官方的 [`include` 文档](https://doc.rust-lang.org/cargo/reference/config.html#the-include-key)。

### Cargo 支持 TOML 1.1

Cargo 现在已经可以解析用于 manifest 和配置文件的 [TOML v1.1](https://toml.io/en/v1.1.0)。详细变化可以查看 [TOML release notes](https://github.com/toml-lang/toml/blob/main/CHANGELOG.md#1100---2024-11-10)，其中包括：

- 支持多行并带尾随逗号的内联表；
- 支持 `\xHH` 与 `\e` 字符串转义；
- 时间中的秒数可选，缺省时会自动补为 0。

例如，下面这种依赖写法：

```toml
serde = { version = "1.0", features = ["derive"] }
```

现在也可以写成这样：

```toml
serde = {
    version = "1.0",
    features = ["derive"],
}
```

需要注意的是，如果你在 `Cargo.toml` 中使用这些新特性，就会抬高开发环境的 MSRV（最低支持 Rust 版本），因为这依赖新的 Cargo 解析器。第三方读取 manifest 的工具也可能需要同步升级解析能力。不过 Cargo 在发布 crate 时会自动重写 manifest，使其仍能兼容旧解析器，因此你的 crate 仍然可以继续支持更早版本的 MSRV。

### 稳定化 API

- [`<[T]>::array_windows`](https://doc.rust-lang.org/stable/std/primitive.slice.html#method.array_windows)
- [`<[T]>::element_offset`](https://doc.rust-lang.org/stable/std/primitive.slice.html#method.element_offset)
- [`LazyCell::get`](https://doc.rust-lang.org/stable/std/cell/struct.LazyCell.html#method.get)
- [`LazyCell::get_mut`](https://doc.rust-lang.org/stable/std/cell/struct.LazyCell.html#method.get_mut)
- [`LazyCell::force_mut`](https://doc.rust-lang.org/stable/std/cell/struct.LazyCell.html#method.force_mut)
- [`LazyLock::get`](https://doc.rust-lang.org/stable/std/sync/struct.LazyLock.html#method.get)
- [`LazyLock::get_mut`](https://doc.rust-lang.org/stable/std/sync/struct.LazyLock.html#method.get_mut)
- [`LazyLock::force_mut`](https://doc.rust-lang.org/stable/std/sync/struct.LazyLock.html#method.force_mut)
- [`impl TryFrom<char> for usize`](https://doc.rust-lang.org/stable/std/convert/trait.TryFrom.html)
- [`std::iter::Peekable::next_if_map`](https://doc.rust-lang.org/stable/std/iter/struct.Peekable.html#method.next_if_map)
- [`std::iter::Peekable::next_if_map_mut`](https://doc.rust-lang.org/stable/std/iter/struct.Peekable.html#method.next_if_map_mut)
- [`x86 avx512fp16 intrinsics`](https://github.com/rust-lang/rust/pull/148621)（排除了直接依赖不稳定 `f16` 类型的部分）
- [`AArch64 NEON fp16 intrinsics`](https://github.com/rust-lang/stdarch/pull/1829)（排除了直接依赖不稳定 `f16` 类型的部分）
- [`f32::consts::EULER_GAMMA`](https://doc.rust-lang.org/stable/std/f32/consts/constant.EULER_GAMMA.html)
- [`f64::consts::EULER_GAMMA`](https://doc.rust-lang.org/stable/std/f64/consts/constant.EULER_GAMMA.html)
- [`f32::consts::GOLDEN_RATIO`](https://doc.rust-lang.org/stable/std/f32/consts/constant.GOLDEN_RATIO.html)
- [`f64::consts::GOLDEN_RATIO`](https://doc.rust-lang.org/stable/std/f64/consts/constant.GOLDEN_RATIO.html)

下面这些原本已经稳定的 API，现在也支持在 const 上下文中使用：

- [`f32::mul_add`](https://doc.rust-lang.org/stable/std/primitive.f32.html#method.mul_add)
- [`f64::mul_add`](https://doc.rust-lang.org/stable/std/primitive.f64.html#method.mul_add)

### 其他变化

还可以继续查看 [Rust](https://github.com/rust-lang/rust/blob/stable/RELEASES.md#version-1940-2026-03-05)、[Cargo](https://doc.rust-lang.org/stable/cargo/CHANGELOG.html#cargo-194-2026-02-26) 和 [Clippy](https://github.com/rust-lang/rust-clippy/blob/master/CHANGELOG.md#rust-194) 在这次版本里的完整更新内容。

## Rust 1.94.0 的贡献者

Rust 1.94.0 的发布离不开很多人的共同努力。没有这些贡献者，这个版本就不可能完成。[感谢所有人！](https://thanks.rust-lang.org/rust/1.94.0/)
