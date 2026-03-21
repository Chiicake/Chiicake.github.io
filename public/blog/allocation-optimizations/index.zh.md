---
title: 在栈上分配内存
---
原文链接：[Allocating on the Stack](https://go.dev/blog/allocation-optimizations)，作者 Keith Randall。

我们一直在想办法让 Go 程序跑得更快。在最近两个版本里，Go 团队重点缓解了一个特定的性能瓶颈：堆分配。每当 Go 程序从堆上申请内存时，都要执行一段开销不小的分配路径；与此同时，堆分配还会额外增加垃圾回收器的负担。即便有了 [Green Tea](https://go.dev/blog/greenteagc) 这样的新改进，GC 仍然会带来相当可观的成本。

因此，我们一直在推动更多分配从堆转向栈。栈分配的代价要低得多，有时甚至几乎是免费的。更重要的是，它不会给垃圾回收器增加压力，因为这类分配会随着所属栈帧一起被自动回收。栈分配还支持更及时的复用，这对缓存局部性也很友好。

## 固定大小切片的栈分配

先看一个构造任务切片的例子：

```go
func process(c chan task) {
    var tasks []task
    for t := range c {
        tasks = append(tasks, t)
    }
    processAll(tasks)
}
```

我们来逐步看看：从通道 `c` 中取出任务并追加到切片 `tasks` 时，运行时到底发生了什么。

第一轮循环里，`tasks` 还没有底层数组，所以 `append` 必须先分配一块 backing store。因为它并不知道切片最终会长到多大，所以不可能一开始就分配得特别激进。目前的策略是先分配一个容量为 1 的底层数组。

第二轮循环时，底层数组已经存在，但已经满了。于是 `append` 再次分配一块新的 backing store，这次容量是 2。原来容量为 1 的那块数组就成了垃圾。

第三轮循环里，容量为 2 的 backing store 又满了。`append` 继续分配一块新的，这次容量变成 4。原来容量为 2 的那块数组同样变成垃圾。

第四轮循环时，容量为 4 的 backing store 里只放了 3 个元素，所以 `append` 只需要把新元素放进去，再更新切片长度即可。很好，这一轮完全不需要调用分配器。

第五轮循环时，容量为 4 的 backing store 填满了，`append` 又会再分配一块容量为 8 的底层数组。

后面基本也是同样的模式。每次填满时，我们通常都会把容量翻倍，这样后续大多数 `append` 都不需要重新分配。但当切片还很小时，前面这段“启动阶段”其实有不少额外开销。这个阶段里，我们频繁调用分配器，又制造出一堆很快就会变成垃圾的临时数组，看起来相当浪费。而且在很多实际程序里，切片根本不会长得很大，你可能始终遇到的都只是这段启动阶段。

如果这段代码正好处在程序的热点路径里，你很可能会想：那不如一开始就把切片开大一点，避免这些连续分配。

```go
func process2(c chan task) {
    tasks := make([]task, 0, 10) // 大概率最多 10 个任务
    for t := range c {
        tasks = append(tasks, t)
    }
    processAll(tasks)
}
```

这是一个相当合理的优化，而且永远不会破坏正确性。如果猜小了，`append` 还是会像之前那样继续扩容分配；如果猜大了，损失的也只是一些额外内存。

如果你对任务数量的估计足够准，那么这个程序理论上就只剩下一个分配点了。`make` 一次性分配出足够大的底层数组，而 `append` 后面不再触发重新分配。

但更有意思的是：如果你拿一个恰好包含 10 个元素的通道来 benchmark，会发现分配次数并没有从多次降到 1，而是直接降到了 0。

原因在于，编译器决定把这块 backing store 放到栈上。因为它已经知道所需大小，也就是 10 个 `task` 的总大小，所以它可以把这块存储直接布置到 `process2` 的栈帧里，而不是从堆上分配[^1]。当然，这依赖于一个前提：这块 backing store 在 `processAll` 中不会[逃逸到堆上](https://go.dev/wiki/CompilerOptimizations#escape-analysis-and-inlining)。

## 可变大小切片的栈分配

不过，把容量猜测直接写死在代码里还是太僵硬了。能不能把这个估计值作为参数传进来？

```go
func process3(c chan task, lengthGuess int) {
    tasks := make([]task, 0, lengthGuess)
    for t := range c {
        tasks = append(tasks, t)
    }
    processAll(tasks)
}
```

这样，调用方就可以根据具体调用场景，为 `tasks` 传入更合适的容量估计。

遗憾的是，在 Go 1.24 里，一旦 backing store 的大小不再是编译期常量，编译器就无法再把它放到栈上。最终它会落回堆里，让原本 0 次分配的代码退化成 1 次分配。虽然仍然比让 `append` 逐步经历中间扩容要好，但总归有点可惜。

不过别担心，Go 1.25 来了。

假设你为了只在“小估计值”场景里拿到栈分配，打算手工写成下面这样：

```go
func process4(c chan task, lengthGuess int) {
    var tasks []task
    if lengthGuess <= 10 {
        tasks = make([]task, 0, 10)
    } else {
        tasks = make([]task, 0, lengthGuess)
    }
    for t := range c {
        tasks = append(tasks, t)
    }
    processAll(tasks)
}
```

这写法有点丑，但确实可行。估计值较小时，你走固定大小的 `make`，因此 backing store 能放在栈上；估计值较大时，再走可变大小的 `make`，让 backing store 从堆上分配。

但到了 Go 1.25，你已经不需要自己写这种难看的分支了。Go 1.25 的编译器会自动替你做这层转换。对于某些切片分配位置，编译器会先在栈上准备一小块 backing store，目前大小是 32 字节；如果 `make` 请求的容量足够小，就直接复用这块栈上存储，否则再按正常路径走堆分配。

在 Go 1.25 中，如果 `lengthGuess` 足够小，小到对应长度的切片能够放进这 32 字节里，并且这个估计值确实接近 `c` 中元素数量，那么 `process3` 就可以做到 0 次堆分配。

Go 一直在持续提升性能，所以尽量升级到最新版本，你也许会惊讶于程序因此变得更快、也更省内存。

## 由 append 触发分配的切片的栈分配

不过你可能还是不想为了这件事修改 API，再额外加一个奇怪的长度猜测参数。那还有别的办法吗？

升级到 Go 1.26。

```go
func process(c chan task) {
    var tasks []task
    for t := range c {
        tasks = append(tasks, t)
    }
    processAll(tasks)
}
```

在 Go 1.26 里，编译器同样会在栈上准备这种小而投机的 backing store，但这一次它可以直接在 `append` 发生的位置把它用起来。

第一轮循环中，`tasks` 还没有 backing store，因此 `append` 会把那块小型的栈上 backing store 当作第一次分配来使用。举个例子，如果这块栈上空间能放下 4 个 `task`，那么第一次 `append` 实际得到的就是一个长度为 4、位于栈上的 backing store。

接下来的 3 轮循环都可以直接往这块栈上 backing store 里追加元素，不需要任何分配。

等到第 4 轮之后，这块栈上 backing store 才真正被填满，这时才需要回到堆上申请更大的底层数组。但这样一来，文章前面提到的大部分启动阶段开销就都被避开了。不会再发生容量为 1、2、4 的那些堆分配，也不会制造出随后变成垃圾的中间数组。如果你的切片本来就很小，甚至可能从头到尾都不会发生堆分配。

## 由 append 触发分配、且会逃逸的切片的栈分配

前面这些优化都建立在 `tasks` 切片不会逃逸的前提上。但如果我要把这个切片返回出去呢？那它总不能还分配在栈上吧？

没错。下面这个 `extract` 返回的切片，它的 backing store 不能放在栈上，因为 `extract` 返回时，它的栈帧就已经不存在了。

```go
func extract(c chan task) []task {
    var tasks []task
    for t := range c {
        tasks = append(tasks, t)
    }
    return tasks
}
```

但你也许会想：返回出去的那个最终切片当然不能在栈上，那些中途产生、最后只是变成垃圾的中间切片呢？是不是可以把它们放在栈上？

```go
func extract2(c chan task) []task {
    var tasks []task
    for t := range c {
        tasks = append(tasks, t)
    }
    tasks2 := make([]task, len(tasks))
    copy(tasks2, tasks)
    return tasks2
}
```

这样一来，`tasks` 本身就不会从 `extract2` 中逃逸，因此它仍然可以享受到前面所有那些优化。然后在 `extract2` 的最后，当我们终于知道切片的最终大小时，再做一次恰好合适的堆分配，把这些 `task` 复制进去，并返回这份副本。

但你真的想手写这么多额外代码吗？这看起来既繁琐又容易出错。也许编译器可以替我们完成这种转换？

在 Go 1.26 里，答案是可以。

对于会逃逸的切片，编译器会把原本的 `extract` 转换成类似下面这样的形式：

```go
func extract3(c chan task) []task {
    var tasks []task
    for t := range c {
        tasks = append(tasks, t)
    }
    tasks = runtime.move2heap(tasks)
    return tasks
}
```

`runtime.move2heap` 是一个编译器和运行时协同支持的特殊函数。对于本来就已经分配在堆上的切片，它就是恒等操作；而对于还在栈上的切片，它会新建一个堆上的切片，把那份栈上数据复制过去，再返回复制后的堆上版本。

这样就能保证：对于最初那个 `extract`，如果元素数量刚好能装进那块小型栈上缓冲区，我们就只会做 1 次分配，而且这次分配的大小恰好正确；如果元素数量超出了那块小栈缓冲区的容量，那么在它溢出之后，程序就会回到原来那套按倍数增长的分配逻辑。

Go 1.26 的这个优化其实比手写版还更好，因为它不会像手工优化那样总是在结尾额外做一次“分配加复制”。只有当切片一路都停留在栈上、直到返回点时，它才需要执行这次分配和复制。

虽然我们确实为复制付出了一点成本，但这几乎完全被前面启动阶段那些不再需要的复制抵消掉了。事实上，在最坏情况下，新方案也只会比旧方案多复制一个元素而已。

## 总结

手工优化仍然可能有价值，尤其是在你能提前对切片大小做出较好估计时。但希望编译器现在已经能帮你自动覆盖掉很多简单场景，让你把注意力放在那些真正值得手工打磨的热点上。

当然，编译器为了把这些优化做对，还需要满足很多细节条件。如果你怀疑其中某项优化给你的程序带来了正确性问题，或者出现了负向性能影响，可以用 `-gcflags=all=-d=variablemakehash=n` 把它们关掉。如果关闭这些优化后问题缓解了，建议去 [提交 issue](https://go.dev/issue/new)，方便 Go 团队继续调查。

## 脚注

[^1]: Go 的栈并没有类似 `alloca` 那样、支持动态大小栈帧的机制。所有 Go 栈帧的大小都是固定的。
