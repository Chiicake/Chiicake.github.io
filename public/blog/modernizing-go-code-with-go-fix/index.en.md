---
title: Using go fix to modernize Go code
---
Original article: [Using go fix to modernize Go code](https://go.dev/blog/gofix)

The Go 1.26 release includes a completely rewritten `go fix` subcommand. It uses a suite of analyzers to find opportunities to improve source code, often by replacing older patterns with newer language and library features. This article explains how to use `go fix`, then looks at the analysis infrastructure behind it, and finally introduces the emerging “self-service” model for package maintainers and organizations.

## Running go fix

Like `go build` and `go vet`, the `go fix` command accepts package patterns. To fix every package under the current directory:

```sh
$ go fix ./...
```

On success, the command silently updates source files in place. It skips generated files, because in those cases the real fix should happen in the generator itself. A practical workflow is to run `go fix` whenever you move your build to a newer Go toolchain, starting from a clean git state so the resulting diff only contains modernization changes.

To preview the edits first, use the `-diff` flag:

```diff
$ go fix -diff ./...
--- dir/file.go (old)
+++ dir/file.go (new)
-                       eq := strings.IndexByte(pair, '=')
-                       result[pair[:eq]] = pair[1+eq:]
+                       before, after, _ := strings.Cut(pair, "=")
+                       result[before] = after
...
```

You can list all available fixers with:

```text
$ go tool fix help
…
Registered analyzers:
    any          replace interface{} with any
    buildtag     check //go:build and // +build directives
    fmtappendf   replace []byte(fmt.Sprintf) with fmt.Appendf
    forvar       remove redundant re-declaration of loop variables
    hostport     check format of addresses passed to net.Dial
    inline       apply fixes based on 'go:fix inline' comment directives
    mapsloop     replace explicit loops over maps with calls to maps package
    minmax       replace if/else statements with calls to min or max
…
```

And you can inspect one analyzer in detail:

```text
$ go tool fix help forvar

forvar: remove redundant re-declaration of loop variables

The forvar analyzer removes unnecessary shadowing of loop variables.
Before Go 1.22, it was common to write `for _, x := range s { x := x ... }`
to create a fresh variable for each iteration. Go 1.22 changed the semantics
of `for` loops, making this pattern redundant. This analyzer removes the
unnecessary `x := x` statement.

This fix only applies to `range` loops.
```

By default, `go fix` runs every analyzer. On a large code base, it may be easier to review changes if you apply the most prolific analyzers separately. You can enable a specific analyzer with a flag such as `-any`, or disable one with `-any=false`.

As with `go build` and `go vet`, each invocation analyzes one concrete build configuration. If your project has many `GOOS` or `GOARCH`-specific files, it may be worth running the command multiple times:

```sh
$ GOOS=linux   GOARCH=amd64 go fix ./...
$ GOOS=darwin  GOARCH=arm64 go fix ./...
$ GOOS=windows GOARCH=amd64 go fix ./...
```

Running the tool more than once can also unlock additional synergistic fixes.

### Modernizers

The arrival of generics in Go 1.18 marked the end of an era in which the language and standard library changed very slowly. Since then, the standard library has accumulated many opportunities to simplify older code. A loop that manually collects map keys can often be replaced by a call to `maps.Keys`, and similar modernization opportunities exist across the ecosystem.

The Go team also observed that LLM coding assistants often kept producing patterns that reflected older Go idioms, even when newer and clearer forms existed. If the broader open-source corpus is not modernized, the next generation of tools will continue learning the old style. That was one motivation for building many small modernizers over the last year.

Three representative examples:

- `minmax` turns a pair of clamping `if` statements into calls to `min` and `max`.
- `rangeint` replaces a three-clause loop with Go 1.22’s `range`-over-int form.
- `stringscut` replaces `strings.Index` plus slicing with `strings.Cut`.

For example, `minmax` can rewrite:

```go
x := f()
if x < 0 {
    x = 0
}
if x > 100 {
    x = 100
}
```

into:

```go
x := min(max(f(), 0), 100)
```

And `rangeint` can rewrite:

```go
for i := 0; i < n; i++ {
    f()
}
```

into:

```go
for range n {
    f()
}
```

These modernizers are available in both `gopls` and `go fix`, so they can help while you type and also modernize entire packages in one pass.

## Example: a modernizer for Go 1.26’s new(expr)

Go 1.26 adds a small but widely useful language change: the built-in `new` function can now accept any value expression, not just a type. Historically, `new(string)` created a zero-initialized variable of type `string` and returned its address. In Go 1.26, `new("go1.26")` creates a variable initialized to that value directly.

So code like this:

```go
ptr := new(string)
*ptr = "go1.25"
```

can become:

```go
ptr := new("go1.26")
```

This is especially useful for APIs that use pointer types to express optional values. Before Go 1.26, developers often introduced helpers such as:

```go
type RequestJSON struct {
    URL      string
    Attempts *int
}

data, err := json.Marshal(&RequestJSON{
    URL:      url,
    Attempts: newInt(10),
})

func newInt(x int) *int { return &x }
```

Now the helper is unnecessary:

```go
data, err := json.Marshal(&RequestJSON{
    URL:      url,
    Attempts: new(10),
})
```

The `newexpr` fixer in Go 1.26 can identify this pattern, rewrite helper bodies to `return new(x)`, and replace call sites with direct uses of `new(expr)`. To avoid introducing too-new syntax into older files, the fixer only fires when the file already requires a sufficiently new Go version, such as `go 1.26` in `go.mod` or `//go:build go1.26`.

To apply this modernization across a tree:

```sh
$ go fix -newexpr ./...
```

Once those helpers are no longer referenced, they can often be deleted.

## Synergistic fixes

Some fixes enable other fixes. A clamp-style `if` chain may first become a call to `max`, then a second pass may discover that it can also be wrapped in `min`. Similar synergies can happen across analyzers.

For instance, consider repeated string concatenation inside a loop:

```go
s := ""
for _, b := range bytes {
    s += fmt.Sprintf("%02x", b)
}
use(s)
```

One modernizer can rewrite this to use `strings.Builder`:

```go
var s strings.Builder
for _, b := range bytes {
    s.WriteString(fmt.Sprintf("%02x", b))
}
use(s.String())
```

After that, another analyzer may recognize that `WriteString` and `Sprintf` can be combined into `fmt.Fprintf(&s, "%02x", b)`. Because of these interactions, it is often worth running `go fix` more than once until it reaches a fixed point. In practice, two passes are usually enough.

### Merging fixes and conflicts

A single run of `go fix` may produce dozens of edits in the same file. Conceptually, they are like a set of independent commits based on the same parent. The tool uses a simple three-way merge strategy to apply them one by one. If a new edit conflicts with already accumulated changes, that fix is skipped and the tool warns that another pass may be needed.

This detects overlapping textual edits, but semantic conflicts can still happen. For example, two independent fixes may each remove one of the last remaining uses of a local variable. After both are applied, the variable becomes unused and the code no longer compiles. Likewise, a set of fixes may make an import unused. Since that case is common, `go fix` performs a final cleanup pass to remove unused imports automatically.

Semantic conflicts are uncommon, and they usually surface as compilation errors, which makes them easy to notice. But occasionally they still require small manual cleanup after a run.

## The Go analysis framework

Since the earliest days of Go, the `go` command has had two subcommands for static analysis: `go vet` and `go fix`. In 2017, the `go vet` implementation was reworked to separate analyzers from the driver that runs them, producing the Go analysis framework. That change made it possible to write an analyzer once and run it in many different environments:

- `unitchecker`, used by `go vet` and now also by `go fix`
- `nogo`, for alternative build systems such as Bazel and Blaze
- `singlechecker`, for one-off experiments and measurements
- `multichecker`, for suites of analyzers with a swiss-army-knife CLI
- `gopls`, for real-time editor diagnostics and quick fixes
- `staticcheck`’s driver
- Google’s Tricorder pipeline
- `gopls`’ MCP server for LLM-based coding agents
- `analysistest`, the framework’s test harness

The framework also supports helper analyzers that compute shared intermediate structures instead of reporting diagnostics themselves. Examples include control-flow graphs, SSA, and optimized AST navigation helpers.

Another major capability is inter-package “facts”. An analyzer can attach information to a function or symbol while analyzing one package, and later consume that information while analyzing another package. This makes scalable interprocedural analysis practical. The `printf` checker, for example, can infer that a wrapper such as `log.Printf` should be validated like `fmt.Printf`, and that logic can propagate through further wrappers as well.

![Analysis facts diagram](assets/gofix-analysis-facts.svg)

Separate analysis in `go fix` is analogous to separate compilation in `go build`: analysis starts at the bottom of the dependency graph and passes types and facts upward to importing packages.

In 2019, while developing `gopls`, the Go team added support for analyzers to suggest fixes alongside diagnostics. A `printf` warning, for example, may offer to rewrite `fmt.Printf(msg)` to `fmt.Printf("%s", msg)` when that avoids accidental formatting. This capability became the foundation for many editor quick fixes.

Go 1.26 finally brings that same analysis framework to `go fix`. At this point `go vet` and `go fix` are nearly identical in implementation. The main difference lies in what their analyzers are allowed to do: `go vet` analyzers must report likely mistakes with low false positive rates, while `go fix` analyzers must produce edits that are safe to apply without regressing correctness, performance, or style.

### Improving analysis infrastructure

As the number of analyzers grows, the Go team has been investing in infrastructure to improve both performance and authoring ergonomics.

For example, many analyzers begin by traversing syntax trees looking for nodes of a specific kind. The `inspector` package already made such scans efficient by precomputing an index of traversal state. More recently, its `Cursor` API was extended to allow efficient navigation up, down, left, and right through the tree, making queries like “find each `go` statement that is the first statement of a loop body” both expressive and fast:

```go
var curFile inspector.Cursor = ...

// Find each go statement that is the first statement of a loop body.
for curGo := range curFile.Preorder((*ast.GoStmt)(nil)) {
    kind, index := curGo.ParentEdge()
    if kind == edge.BlockStmt_List && index == 0 {
        switch curGo.Parent().ParentEdgeKind() {
        case edge.ForStmt_Body, edge.RangeStmt_Body:
            ...
        }
    }
}
```

Another example is `typeindex`, which precomputes symbol-reference indexes so analyzers can enumerate calls to a specific function such as `fmt.Printf` directly, instead of scanning every call expression in a package. For narrow analyzers such as `hostport`, that can yield dramatic speedups.

Other recent infrastructure work includes:

- a standard-library dependency graph to avoid introducing import cycles
- support for querying the effective Go version of a file
- a richer library of refactoring primitives that handles comments and edge cases correctly

The team also notes that authoring fixers remains tricky. Because users may apply hundreds of suggested fixes with only light review, correctness in obscure edge cases is critical. Better documentation, better pattern matching, richer edit primitives, and stronger test harnesses are all still on the roadmap.

## The “self-service” paradigm

In 2026, the Go team is also pushing toward a broader “self-service” model.

The `newexpr` analyzer is a typical example of a bespoke modernizer tailored to a particular language or standard-library feature. That model works well for core Go features, but it does not scale naturally to third-party packages. Package maintainers can write analyzers for their own APIs, but getting those analyzers in front of every user currently involves review, approval, and release bottlenecks.

Under a self-service model, Go programmers would be able to define modernizations for their own APIs and let downstream users apply them directly, without relying on a central pipeline for every change. This matters because the Go community and global code corpus are growing much faster than the Go team’s capacity to centrally review analyzer contributions.

Go 1.26 already offers a preview of this direction through the annotation-driven source-level inliner. Over the coming year, the team plans to explore two further directions.

First, it wants to investigate dynamically loading modernizers from source trees and executing them safely in `gopls` or `go fix`. That would let package authors ship API-specific diagnostics and modernization logic alongside their libraries, and would also let organizations encode internal rules such as avoiding problematic functions or enforcing stronger coding discipline in critical packages.

Second, the team wants to generalize the class of analyzers that can be summarized as “after you do X, don’t forget to do Y”. Examples include:

- close a file after opening it
- cancel a context after creating it
- unlock a mutex after locking it
- break out of an iterator loop after `yield` returns false

These are all control-flow properties. The hope is to build tools that let Go programmers define such checks for their own domains without having to write complex analysis logic from scratch.

The broader goal is simple: help maintainers keep their projects modern, save effort during upgrades, and let users benefit from newer Go features sooner. The Go team encourages developers to try `go fix` on real projects and share ideas for new modernizers, checkers, fixers, and self-service analysis patterns.
