---
title: An Overview of Programming Paradigms
---

Programming paradigms can be understood as different ways of organizing code and modeling problems. Different paradigms embody different views of computation, state management, and program structure, which in turn shape how code is expressed, extended, and reused.

This article gives a brief introduction to several common programming paradigms, and also serves as a consolidation of what I have been studying at this stage.

## I. A General View of Paradigms

![Programming paradigms overview](./assets/file-20260314002353711.png)

The figure shows how, starting from the earliest descriptive languages, various programming paradigms gradually branched out as different semantic mechanisms were continuously layered on top. Most arrows in the figure can be read as "adding one more capability to an existing model," such as closure, cell, thread, search, port, or constraint. As these mechanisms are introduced, first-order functional programming can develop into functional programming, and functional programming can in turn move toward the imperative style once mutable state is added. What we call a "paradigm" is, in essence, just a different combination of these mechanisms.

The horizontal axis roughly represents a transition from "more declarative" to "less declarative." The further left a paradigm is, the more it tends to describe relations, constraints, and dependencies, and coding looks more like defining *what should hold*. The further right it is, the more it tends to manipulate state, control flow, and interactions, and coding looks more like specifying *how to execute*. The former usually emphasizes expression and reasoning, while the latter usually emphasizes state management and engineering implementation.

It is also easy to see that many languages mix multiple programming paradigms at the same time. A paradigm is nothing more than a different answer to these fundamental questions at a different point in the design space.

## II. Functional Programming

### 2.1 How Functional Programming Evolved

As the figure shows, functional programming developed from first-order functional programming after closures were introduced. The significance of closures is that functions are no longer merely "callable procedures"; they become objects that can carry environments, be passed around as values, and be returned. It is precisely at this point that functions truly become first-class citizens, and only then does functional programming gain its full expressive power.

If we keep moving downward along this path, we encounter branches such as lazy functional programming, dataflow programming, and FRP. Functional programming emphasizes viewing computation as function mapping, and then gradually extending the same way of thinking on that basis.

### 2.2 Characteristics of Functional Programming

Functional programming is primarily concerned with the mapping from input to output, that is, with the function itself. Unlike imperative programming, which emphasizes how state changes step by step, functional programming emphasizes how one expression is evaluated into another value. In a more typical functional style, the following features usually stand out:

- **An emphasis on pure functions**: the same input should produce the same output, and the behavior of a function should depend as little as possible on mutable external state.
- **An emphasis on immutability**: once data has been constructed, it is usually not modified directly; change is expressed by constructing a new value.
- **An emphasis on composition**: programs are built through the nesting, connection, and transformation of functions, rather than primarily by advancing through procedural steps.
- **A weakening of shared mutable state**: I/O, global state updates, and writes to shared variables are usually isolated or handled explicitly.

### 2.3 Common Techniques in Functional Programming

Much of the expressive power of functional programming comes from a number of common techniques and abstractions:

- **Higher-order functions**: functions can take other functions as arguments and can also return functions.
- **Map / Filter / Reduce**: traversal, selection, and aggregation are abstracted into reusable combinators.
- **Pipeline**: multiple processing stages are chained together so that data is transformed in a fixed direction.
- **Currying**: a multi-parameter function is transformed into a sequence of single-parameter functions, making composition and partial application easier.
- **Lazy Evaluation**: evaluation is deferred until the result is actually needed.
- **Iterator / Stream**: explicit loop control is replaced with a continuous flow of data transformations.

### 2.4 A Simple Functional Style

In practice, functional programming tends to emphasize expressing computation through iterator composition, weakening explicit loops and externally mutable state. Using the trapping-rain-water problem as an example, a typical imperative version looks like this:

```rust
pub fn trap_imperative(height: Vec<i32>) -> i32 {
    let n = height.len();
    if n == 0 {
        return 0;
    }

    let mut pre = vec![0; n];
    let mut suf = vec![0; n];

    pre[0] = height[0];
    for i in 1..n {
        pre[i] = pre[i - 1].max(height[i]);
    }

    suf[n - 1] = height[n - 1];
    for i in (0..n - 1).rev() {
        suf[i] = suf[i + 1].max(height[i]);
    }

    let mut ans = 0;
    for i in 0..n {
        ans += pre[i].min(suf[i]) - height[i];
    }

    ans
}
```

The structure of this code is very direct: first build the prefix-maximum and suffix-maximum arrays, then accumulate the result in one final loop. The entire solution is built around the step-by-step update of several explicit variables, so the state transitions are unfolded directly in front of the reader.

By contrast, a version with a stronger functional flavor might look like this:

```rust
pub fn trap_functional(height: Vec<i32>) -> i32 {
    let pre: Vec<i32> = height
        .iter()
        .scan(0, |mx, &h| {
            *mx = (*mx).max(h);
            Some(*mx)
        })
        .collect();

    let suf: Vec<i32> = height
        .iter()
        .rev()
        .scan(0, |mx, &h| {
            *mx = (*mx).max(h);
            Some(*mx)
        })
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();

    height
        .iter()
        .zip(pre.iter())
        .zip(suf.iter())
        .map(|((&h, &l), &r)| l.min(r) - h)
        .sum()
}
```

This version does not change the algorithm itself; what changes is the way it is expressed. The prefix maxima and suffix maxima are built with `scan`, and the final answer is derived through `map` and `sum`. The explicit accumulator variable is replaced by a relatively continuous transformation pipeline. It is certainly not pure functional programming in the strict sense, but it already exhibits an obvious functional style: instead of directly commanding each step of execution, the programmer is more inclined to describe how the data is transformed continuously.

## III. Object-Oriented Programming

### 3.1 An Overview of OOP

If functional programming tends to understand a program as a transformation from value to value, then object-oriented programming tends to understand it as collaboration among a set of objects. Objects carry internal state, expose methods, and form boundaries toward the outside world. At runtime, system behavior is often expressed as message calls, method dispatch, and state changes among these objects. For this reason, OOP is closer to the way real-world entities are modeled, and it is especially common in large business systems.

### 3.2 Main Characteristics of OOP

Object-oriented programming is usually discussed around the following keywords:

- **Encapsulation**: organize data together with the methods that operate on it, while hiding internal implementation details.
- **Abstraction**: expose only the necessary interfaces and conceal unnecessary internal structure.
- **Inheritance**: extend new types from existing ones and reuse behavior.
- **Polymorphism**: allow different implementations behind a unified interface to improve extensibility.

From a practical point of view, however, what really matters is not just these concepts themselves, but the organizational style behind them. OOP cares about what entities exist in a system, what state those entities carry, how they interact with one another, and how responsibilities should be divided. It is good at dealing with problems that involve identity, lifecycle, and collaboration, such as users, orders, sessions, connections, task schedulers, and so on.

Compared with functional programming, OOP takes a completely different stance toward state. Functional programming usually tries to weaken or isolate state, whereas OOP accepts state as a central part of system modeling and attempts to manage its complexity through encapsulation, object boundaries, and interface design.

### 3.3 An Example in an OOP Style

Again using the trapping-rain-water problem, if we adopt an object-oriented style, we can encapsulate both the data and the solving logic inside a struct:

```rust
pub struct RainWaterTrapper {
    height: Vec<i32>,
    pre: Vec<i32>,
    suf: Vec<i32>,
}

impl RainWaterTrapper {
    pub fn new(height: Vec<i32>) -> Self {
        let n = height.len();
        Self {
            height,
            pre: vec![0; n],
            suf: vec![0; n],
        }
    }

    fn build_prefix_max(&mut self) {
        if self.height.is_empty() {
            return;
        }

        self.pre[0] = self.height[0];
        for i in 1..self.height.len() {
            self.pre[i] = self.pre[i - 1].max(self.height[i]);
        }
    }

    fn build_suffix_max(&mut self) {
        if self.height.is_empty() {
            return;
        }

        let n = self.height.len();
        self.suf[n - 1] = self.height[n - 1];
        for i in (0..n - 1).rev() {
            self.suf[i] = self.suf[i + 1].max(self.height[i]);
        }
    }

    fn calculate_water(&self) -> i32 {
        let mut ans = 0;
        for i in 0..self.height.len() {
            ans += self.pre[i].min(self.suf[i]) - self.height[i];
        }
        ans
    }

    pub fn solve(&mut self) -> i32 {
        self.build_prefix_max();
        self.build_suffix_max();
        self.calculate_water()
    }
}

pub fn trap_oop(height: Vec<i32>) -> i32 {
    let mut trapper = RainWaterTrapper::new(height);
    trapper.solve()
}
```

This version is algorithmically identical to the imperative version, but structurally it already reflects the organizing style of OOP: `height`, `pre`, and `suf` are encapsulated inside the same object; prefix construction, suffix construction, and result calculation are split into object methods; and the overall solving process is coordinated by `solve`. In other words, the program is no longer just "a sequence of steps," but a structure in which "an object is responsible for its own state and for completing the task."

### 3.4 The Difference Between OOP and Functional Programming

At a high level, the main difference between the two lies in where their attention is directed:

- Functional programming focuses more on computation and composition.
- OOP focuses more on entities, state, and collaboration.
- Functional programming tends to reduce mutable state, while OOP tends to encapsulate and manage it.
- Functional programming emphasizes expressions and transformations, while OOP emphasizes object boundaries and responsibility partitioning.

In real languages and engineering practice, however, they are usually not opposites. Many modern languages provide closures, iterators, object encapsulation, interface abstraction, and related features at the same time; and in actual projects, functional and object-oriented styles are often used together. The former is better for expressing local transformations and compositional logic, while the latter is better for organizing module boundaries and long-lived state.

## IV. Other Paradigms

### 4.1 Imperative Programming

Imperative programming takes state change and sequential execution as its core, driving the program through variables, assignment, loops, and conditional branches. Compared with the compositional style of functional programming, it is closer to the machine execution model and also makes it easier to directly control resources and flow. Languages such as C and Pascal can be regarded as typical representatives of this direction.

### 4.2 Logic Programming and Constraint Programming

Logic programming and constraint programming belong to more declarative branches. These paradigms are not primarily concerned with *how* a sequence of steps should execute, but with *which* relationships hold and *which* conditions must be satisfied. In logic programming, for example, a problem can be described with facts, rules, and queries; in constraint programming, scheduling, allocation, and solving problems can be expressed as a set of constraints, and the system is responsible for finding a satisfying solution. They are closer to writing a solver than to manually orchestrating an execution process.

### 4.3 Concurrent Programming and Message Passing

This branch grows out of mechanisms such as threads, ports, and message passing. Concurrency is not merely "multiple threads running at once"; the more important question is how those execution units share—or do not share—state, how they communicate, and how conflicts are avoided. Shared-state concurrency, message-passing concurrency, the actor style, and multi-agent programming are all, in essence, different answers to this same question. As systems scale up, this dimension often becomes more important than syntax features by themselves.

### 4.4 Dataflow and Reactive Programming

These paradigms emphasize dependency propagation and the organization of computation along the time dimension. A program is no longer executed simply in a fixed textual order; instead, new computation may be triggered as data becomes available, events arrive, or time moves forward. This way of thinking is common in frontend reactive systems, stream-processing systems, and real-time control domains.

## V. Conclusion

Programming paradigms are not just a pile of isolated labels, but different answers to computation, state, control, communication, and organization. Functional programming emphasizes transformation and composition; object-oriented programming emphasizes entities and collaboration; imperative programming emphasizes the advancement of state; logic and constraint programming emphasize relations and solving; and concurrency and message passing extend the problem further into coordination among multiple execution units.

Therefore, when discussing a language, a more meaningful question than simply asking "which paradigm does it belong to?" is often: how does it handle state, organize control flow, express abstraction, deal with concurrency, and which semantic mechanisms does it elevate to first-class language features? The value of paradigms lies not in dividing camps, but in providing different perspectives and modeling approaches.
