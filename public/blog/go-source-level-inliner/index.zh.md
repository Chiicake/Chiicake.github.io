---
title: //go:fix inline 与源码级内联器
---
原文链接：[//go:fix inline and the source-level inliner](https://go.dev/blog/inliner)

Go 1.26 带来了一个全新的 `go fix` 子命令实现，用来帮助你持续让 Go 代码保持现代化、保持最新状态。想先了解整体背景，可以先读一下官方最近关于 [`go fix`](https://go.dev/blog/gofix) 的文章。本文会聚焦其中一个具体能力：源码级内联器（source-level inliner）。

虽然 `go fix` 目前已经内置了一些面向特定语言和标准库新特性的升级器，但源码级内联器是 Go 团队迈向 [self-service](https://go.dev/blog/gofix#self-service) 现代化工具链的第一步成果。它让包作者可以用一种直接且安全的方式表达简单的 API 迁移和更新。下面会先解释源码级内联器是什么、该怎么用，然后再深入几个关键问题以及背后的实现技术。

## 源码级内联

2023 年，Go 团队构建了一个用于 Go 函数调用源码级内联的[算法](https://pkg.go.dev/golang.org/x/tools/internal/refactor/inline)。所谓“内联”一个调用，是指把被调用函数的函数体复制到调用点，并把实参替换进形参位置。之所以叫“源码级”内联，是因为它会对源代码做持久化修改。相比之下，典型编译器里的内联算法，包括 Go 编译器本身，做的是类似变换，但对象是编译器内部短暂存在的[中间表示](https://en.wikipedia.org/wiki/Intermediate_representation)，目的是生成更高效的机器码。

如果你曾在 gopls 里用过 ["Inline call"](https://go.dev/gopls/features/transformation#refactorinlinecall-inline-call-to-function) 这一交互式重构功能，那你其实已经用过源码级内联器了。下面两张图展示了把 `six` 函数中对 `sum` 的调用内联后的效果。

![内联前](assets/inline-before.png)
![内联后](assets/inline-after.png)

内联器是很多源码变换工具的重要基础能力。例如，gopls 在“Change signature”和“Remove unused parameter”重构里都会用到它，因为正如后文会看到的，它处理了函数调用重构过程中大量细微但关键的正确性问题。

同一个内联器现在也被纳入了全新的 `go fix` 命令。在 `go fix` 中，它通过新的 `//go:fix inline` 指令注释来支持自助式 API 迁移和升级。下面来看几个具体例子，看看它能做什么、又是怎么工作的。

### 示例：重命名 `ioutil.ReadFile`

在 Go 1.16 中，用于读取文件内容的 `ioutil.ReadFile` 被废弃，官方推荐使用新的 `os.ReadFile`。从效果上说，这相当于函数被重命名了，只不过 Go 的[兼容性承诺](https://go.dev/doc/go1compat)决定了旧名字永远不能真正删除。

```go
package ioutil

import "os"

// ReadFile reads the file named by filename…
// Deprecated: As of Go 1.16, this function simply calls [os.ReadFile].
func ReadFile(filename string) ([]byte, error) {
    return os.ReadFile(filename)
}
```

理想情况下，我们希望所有 Go 程序都逐步停止使用 `ioutil.ReadFile`，转而直接调用 `os.ReadFile`。内联器正可以帮助完成这件事。第一步是在旧函数上加上 `//go:fix inline` 注释。这个注释告诉工具：只要看到对该函数的调用，就尝试把它内联掉。

```go
package ioutil

import "os"

// ReadFile reads the file named by filename…
// Deprecated: As of Go 1.16, this function simply calls [os.ReadFile].
//go:fix inline
func ReadFile(filename string) ([]byte, error) {
    return os.ReadFile(filename)
}
```

当 `go fix` 作用到包含 `ioutil.ReadFile` 调用的文件时，就会应用如下替换：

```diff
$ go fix -diff ./...
-import "io/ioutil"
+import "os"

-   data, err := ioutil.ReadFile("hello.txt")
+   data, err := os.ReadFile("hello.txt")
```

调用被内联了，本质上就是把对一个函数的调用替换成对另一个函数的调用。

因为内联器做的是“用被调函数函数体的拷贝替换调用”，而不是随意做表达式重写，所以理论上它不应该改变程序行为，除了那些会显式检查调用栈的代码。这一点和 `gofmt -r` 一类允许任意重写的工具不同：后者很强大，但也必须格外小心使用。

多年来，Google 内部支持 Java、Kotlin 和 C++ 的团队一直在使用类似的源码级内联工具。到目前为止，这些工具已经在 Google 代码库中消除了数百万处对废弃函数的调用。使用者只需要加上指令，然后等待即可。夜间，机器人会在一个拥有数十亿行代码的单仓里悄悄准备、测试并提交一批批变更。如果一切顺利，到第二天早上，旧代码就已经不再被使用，相关 API 也就可以安全删除。Go 的内联器起步更晚，但在 Google 单仓中也已经准备了超过 18,000 个 changelist。

### 示例：修补 API 设计缺陷

如果发挥一点想象力，其实很多迁移都可以表达成“内联”。来看一个假想的 `oldmath` 包：

```go
// Package oldmath is the bad old math package.
package oldmath

// Sub returns x - y.
func Sub(y, x int) int

// Inf returns positive infinity.
func Inf() float64

// Neg returns -x.
func Neg(x int) int
```

它有几个设计问题：`Sub` 的参数顺序写反了；`Inf` 隐式偏向了两个无穷中的一个；`Neg` 和 `Sub` 的能力重复。假设现在有一个避免了这些问题的 `newmath` 包，我们想让用户迁移过去。第一步就是用 `newmath` 来重新实现旧 API，并把旧函数标记为废弃。之后加上内联指令：

```go
// Package oldmath is the bad old math package.
package oldmath

import "newmath"

// Sub returns x - y.
// Deprecated: the parameter order is confusing.
//go:fix inline
func Sub(y, x int) int {
    return newmath.Sub(x, y)
}

// Inf returns positive infinity.
// Deprecated: there are two infinite values; be explicit.
//go:fix inline
func Inf() float64 {
    return newmath.Inf(+1)
}

// Neg returns -x.
// Deprecated: this function is unnecessary.
//go:fix inline
func Neg(x int) int {
    return newmath.Sub(0, x)
}
```

这样，`oldmath` 的使用者在运行 `go fix` 时，就能把所有对旧函数的调用替换成新的调用。顺便说一句，gopls 很早就把 `inline` 纳入了 analyzer 套件，所以如果你的编辑器接了 gopls，那么只要你加上 `//go:fix inline` 指令，调用点就会开始收到类似 “call of `oldmath.Sub` should be inlined” 的诊断，并附带一个可以直接应用的修复。

例如，下面这段旧代码：

```go
import "oldmath"

var nine = oldmath.Sub(1, 10) // diagnostic: "call to oldmath.Sub should be inlined"
```

会被转换为：

```go
import "newmath"

var nine = newmath.Sub(10, 1)
```

可以看到，修复之后，`Sub` 的参数顺序已经回到了符合直觉的样子。如果足够顺利，内联器甚至可能移除对 `oldmath` 中所有函数的调用，让你直接删掉这个依赖。

`inline` analyzer 还支持类型和常量。如果 `oldmath` 里原本定义了一个有理数类型和一个 π 常量，那么下面这种转发声明就能把它们迁移到 `newmath`，同时保持已有代码的行为不变：

```go
package oldmath

//go:fix inline
type Rational = newmath.Rational

//go:fix inline
const Pi = newmath.Pi
```

每当 `inline` analyzer 遇到对 `oldmath.Rational` 或 `oldmath.Pi` 的引用时，就会把它们改写成对 `newmath` 的引用。

## 内联器的内部机制

乍看之下，源码级内联似乎很直接：把调用替换成被调函数的函数体，为形参引入变量，再把调用点的实参绑定进去。但如果想在处理所有复杂情况和边角问题的同时还能产出可接受的结果，这其实是一个不小的技术挑战。这个内联器本身大约有 7,000 行高度接近编译器风格的密集逻辑。下面看六个让这个问题变得棘手的方面。

### 1. 参数消除

内联器最重要的任务之一，就是尽量把被调函数中的形参直接替换成调用点里的实参。最简单的情况是，实参只是 `0` 或 `""` 这样的简单字面量，此时替换非常直接，参数也可以被完全消掉。

**调用前**

```go
//go:fix inline
func show(prefix, item string) {
    fmt.Println(prefix, item)
}
```

```go
show("", "hello")
```

**调用后**

```go
fmt.Println("", "hello")
```

对于 `404`、`"go.dev"` 这类稍复杂一点的字面量，如果对应参数在被调函数里只出现一次，替换同样没问题。但如果它出现了多次，那就不适合把这些魔法值到处散开，因为这样会掩盖它们之间的联系，后续如果只改了其中一个位置，就可能造成不一致。

因此，在这种情况下内联器必须更保守。只要有一个或多个参数因为任何原因无法被彻底替换，内联器就会插入显式的“参数绑定”声明：

**调用前**

```go
//go:fix inline
func printPair(before, x, y, after string) {
    fmt.Println(before, x, after)
    fmt.Println(before, y, after)
}
```

```go
printPair("[", "one", "two", "]")
```

**调用后**

```go
var before, after = "[", "]"
fmt.Println(before, "one", after)
fmt.Println(before, "two", after)
```

### 2. 副作用

在 Go 里，和其他命令式语言一样，函数调用可能会更新变量，而这些更新又可能影响其他函数的行为。看下面对 `add` 的调用：

```go
func add(x, y int) int { return y + x }

z = add(f(), g())
```

如果简单地把 `x` 替换成 `f()`、把 `y` 替换成 `g()`，会得到：

```go
z = g() + f()
```

但这个结果其实是错的，因为 `g()` 现在会在 `f()` 之前执行。如果两个函数带有副作用，那么副作用的观察顺序已经改变，表达式结果也可能因此发生变化。虽然依赖调用参数之间副作用顺序的代码并不优雅，但工具仍然必须保住语义正确性。

因此，内联器需要尝试证明 `f()` 和 `g()` 不会互相产生副作用影响。如果证明成功，就可以使用更简洁的结果；否则就必须回退到显式绑定：

```go
var x = f()
z = g() + x
```

考虑副作用时，不只是参数表达式本身重要。参数相对于被调函数体中其他代码的求值顺序同样关键。比如下面这个 `add2`：

```go
//go:fix inline
func add2(x, y int) int {
    return x + other() + y
}

add2(f(), g())
```

这次 `x` 和 `y` 在函数体中的使用顺序与声明顺序一致，因此 `f() + other() + g()` 并不会改变 `f()` 和 `g()` 的相对顺序，但它会改变 `other()` 与 `g()` 的顺序。另外，如果函数体在循环中使用参数，那么替换还可能改变副作用发生的次数。

内联器使用一种新的 [hazard analysis](https://cs.opensource.google/go/x/tools/+/refs/tags/v0.42.0:internal/refactor/inline/inline.go;l=1978;drc=e3a69ffcdbb984f50100e76ebca6ff53cf88de9c) 来建模每个被调函数中的副作用顺序。即便如此，它能构建出的安全性证明仍然很有限。例如，如果 `f()` 和 `g()` 只是简单 accessor，那么无论谁先谁后其实都完全安全。优化编译器甚至可能凭借对这两个函数内部实现的了解，安全地重排它们。但内联器不同于编译器：编译器生成的是某一时刻的目标代码，而内联器做的是对源码的永久修改，因此它不能依赖这些短暂、实现细节级的信息。极端一点，看看这个 `start`：

```go
func start() { /* TODO: implement */ }
```

优化编译器今天可以删掉所有 `start()` 调用，因为它当前没有副作用；但内联器不行，因为它明天可能就变得重要。

所以，内联器有时会生成对熟悉项目的人来说“明显过于保守”的结果。在这种情况下，修复后的代码通常仍然值得做一点人工清理。

### 3. “会失效”的常量表达式

你可能会以为：只要实参是同类型常量，把参数变量替换成它总是安全的。出人意料的是，这并不总成立，因为某些原本发生在运行期的检查，在替换之后会提前到编译期，而且可能直接失败。看这个 `index` 调用：

```go
//go:fix inline
func index(s string, i int) byte {
    return s[i]
}

index("", 0)
```

一个天真的内联器可能会把 `s` 替换成 `""`，把 `i` 替换成 `0`，得到 `""[0]`。但这并不是合法的 Go 表达式，因为这个索引对这个字符串来说越界了。由于 `""[0]` 完全由常量构成，它会在编译期被求值，程序甚至无法通过编译。而原始程序只有在实际执行到这次调用时才会失败——通常一个工作中的程序根本不会走到那里。

因此，内联器必须跟踪那些在参数替换后可能变成常量的表达式及其操作数，从而识别出新增的编译期检查。它会构建一个[约束系统](https://cs.opensource.google/go/x/tools/+/master:internal/refactor/inline/falcon.go;l=43;drc=1aca71e85510ecc45dddbc335b30b64298c2a31e)并尝试求解。凡是无法满足的约束，都会通过为受影响参数增加显式绑定来解决。

### 4. 遮蔽

典型的参数表达式往往包含一个或多个标识符，这些标识符在调用者文件里指向某些符号（变量、函数等等）。内联器必须确保：参数替换之后，这些名字仍然指向原来的符号。换句话说，调用者里的名字不能在被调函数中被 *shadow* 掉。如果这一点做不到，内联器就需要再次插入参数绑定，比如下面这个例子：

**调用前**

```go
//go:fix inline
func f(val string) {
    x := 123
    fmt.Println(val, x)
}
```

```go
x := "hello"
f(x)
```

**调用后**

```go
x := "hello"
{
    var val string = x
    x := 123
    fmt.Println(val, x)
}
```

反过来，内联器也必须检查：被调函数体里的每个名字，在被拼接进调用点之后，是否仍然指向原本的目标。也就是说，被调函数里的名字在调用者上下文中也不能被遮蔽或直接缺失。对于缺失的名字，内联器有时还需要补充 import。

### 5. 未使用变量

当某个实参表达式没有副作用，而且对应参数在被调函数中从未被使用时，这个表达式就可以被删掉。但如果这个表达式里恰好包含了调用者局部变量的最后一次引用，那么删掉之后就可能引发编译错误，因为这个变量变成“未使用”了。

**调用前**

```go
//go:fix inline
func f(_ int) { print("hello") }
```

```go
x := 42
f(x)
```

**调用后**

```go
x := 42 // error: unused variable: x
print("hello")
```

所以内联器必须统计局部变量的引用情况，避免把最后一次引用删掉。当然，仍然可能发生这样一种情况：两个不同的内联修复各自删掉了同一个变量的倒数第二次引用，因此它们单独看都合法，但组合起来就不再成立。这种情形下，人工清理是不可避免的。

### 6. `defer`

有些情况下，根本无法把调用彻底内联掉。比如被调函数里用了 `defer`：如果直接消除调用，那么被 defer 的函数会在 *调用者* 返回时才执行，这显然太晚了。此时唯一安全的办法，是把被调函数体包进一个立刻执行的函数字面量里。这个 `func() { … }()` 恰好也限定了 `defer` 的生命周期：

**调用前**

```go
//go:fix inline
func callee() {
    defer f()
    …
}
```

```go
callee()
```

**调用后**

```go
func() {
    defer f()
    …
}()
```

如果你在 gopls 里触发内联器，就会看到类似上面的变换结果。对于交互式场景，这样的结果可能是合适的，因为你通常会立刻继续调整代码，或者直接撤销这次修复；但在批处理工具里，这几乎总是不理想的。所以作为策略，`go fix` 里的 analyzer 会直接拒绝对这类“literalized”调用做内联。

### 一个以“整洁性”为目标的优化编译器

到这里，我们已经看了六类内联器为保证语义正确而处理的棘手边角问题。把这些复杂性都封装在内联器本身里，才能让用户放心地在 IDE 中执行 “Inline call”，或在自己的函数上添加 `//go:fix inline` 指令，并只需要做最低限度的审查。

虽然 Go 在这个方向上已经取得了不错的进展，但还远远没有走到终点，而且很可能永远也不会真正“完成”。可以把它类比成编译器：一个健全的编译器必须对任何输入都生成正确输出，绝不能误编译你的代码；一个 *优化* 编译器则是在不牺牲正确性的前提下，尽量生成更快的代码。内联器和它很像，只不过它优化的不是速度，而是 *整洁性*：内联调用绝不能改变程序行为，并且理想状态下，产出的代码应该尽可能简洁、整齐、自然。可惜的是，优化编译器从理论上讲是[永远做不完](https://en.wikipedia.org/wiki/Rice%27s_theorem)的：判断两个程序是否等价本身就是不可判定问题，总会有一些变换在人类专家看来显然安全，但工具就是证明不出来。内联器也是一样：总会有一些场景里，它产出的代码过于啰嗦，或者在风格上不如人类专家手工整理的结果；也总会有更多的“整洁性优化”值得继续加入。

## 试试看！

希望这次对源码级内联器的快速巡览，能让你感受到这里面既有的挑战，也能看清 Go 在构建可靠、自助式代码变换工具方面的方向。你可以在 IDE 里交互式试试内联器，也可以通过 `//go:fix inline` 指令配合 `go fix` 命令来试用它，然后把你的体验、问题和新工具想法反馈出来。
