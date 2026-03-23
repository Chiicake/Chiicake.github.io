---
title: Superpowers 工作流解析：多 Agent、Skills 关联与 Brainstorm 门禁
---

## 概述

先看一条链路：

```text
using-superpowers
  -> brainstorming
  -> spec
  -> writing-plans
  -> subagent-driven-development / executing-plans
  -> verification-before-completion
```

![Superpowers 工作流主链](./assets/superpowers-workflow-chain.svg)

如果只把 `superpowers` 看成一组随手可调的 skills，这条链路会显得很重。但从当前 skill 文档来看，它要解决的并不是“模型不会写代码”，而是“模型在没有流程约束时，太容易提前进入实现”。

很多 AI Coding 场景里，问题并不出在语法层面，而是出在更早的地方：需求还没澄清，设计还没定下来，计划还没拆开，验证也没准备好，代码就已经开始生成了。`superpowers` 的核心做法，就是把这些平时很容易被省掉的阶段写成硬约束，再把这些约束串成一条可追踪的工作流。

下面主要看四件事：它为什么先管流程而不是先管能力，`brainstorming` 为什么是整套体系里最硬的一道门，`writing-plans` 怎样把 spec 变成可执行任务，以及多 agent 在这里为什么不是默认并行，而是受限协作。

## 它先约束流程，而不是先增强能力

`using-superpowers` 的第一条规则很直接：只要有 1% 的可能存在适用 skill，就必须先调用 skill，再决定如何行动。这个规则甚至早于澄清问题、早于查看代码、早于“先做一点试试看”。

这不只是形式上的约束。很多编码错误都来自一种很常见的冲动：先看两眼仓库，先改一小处，先把大概版本写出来，后面再补整理。`using-superpowers` 直接把这种冲动列成理性化借口。它反对的，不只是“跳过某个 skill”，而是整套“先动手、后补流程”的做法。

这也是为什么它把 process skills 放在 implementation skills 前面。这里判断的重点不是哪个 skill 更强，而是先确定“这件事该怎么做”，再决定“具体做什么”。如果这一层被拿掉，后面的 `brainstorming`、`writing-plans`、review loop 和 verification gate 就会退回成可选建议，而不是流程本身的一部分。

因此，`using-superpowers` 更像一个入口调度器。它不直接产出设计、代码或测试，但它定义了什么顺序才算合法。对已经习惯直接让模型改文件的人来说，这一层往往也是最不适应的一层，因为它真正限制的是行动时机。

## `brainstorming` 为什么是整套系统的主门禁

如果说 `using-superpowers` 负责阻止“无流程开工”，那 `brainstorming` 负责阻止“需求还模糊就进入实现”。在当前 skill 文档里，它的硬门禁写得非常明确：在展示设计并得到批准之前，不允许调用 implementation skill，不允许写代码，不允许脚手架，不允许采取任何实现动作，而且这个限制适用于“所有项目，不管看起来多简单”。

这条规则的重点，不是强调设计文档本身有多重要，而是强调模糊问题必须先被压缩成可审查对象。为此，`brainstorming` 给出了一条很具体的流程：

1. 先看项目上下文；
2. 一次只问一个问题；
3. 给出 2 到 3 个方案和取舍；
4. 分段展示设计并逐段获得批准；
5. 写成 spec；
6. 跑 spec review loop；
7. 让用户 review spec；
8. 最后才进入 `writing-plans`。

这套顺序里最容易被低估的，有两点。一点是“一次只问一个问题”，它限制了模型把未澄清问题打包处理的冲动。另一点是“必须提出多个方案”，它要求模型显式比较路径，而不是把第一反应伪装成唯一合理解。这样一来，很多原本会拖到实现阶段才暴露的分歧，会提前出现在设计阶段。

所以，把 `brainstorming` 只理解成“创意讨论”并不够。它更像一个需求整形器：把一句模糊请求，一步步整理成能写进 spec、能被 reviewer 检查、也能被后续计划继续拆分的对象。没有这一层，后面的计划写得再细，也只是把模糊输入拆成更多模糊步骤。

## skills 之间不是平铺关系，而是分层关系

如果只看 skill 名单，`superpowers` 很容易被误读成一个命令集合。但从几个核心 skill 的前后依赖来看，它更接近一套分层工作流。

第一层是入口与流程控制层，主要由 `using-superpowers` 负责。它不解决具体业务问题，而是决定当前任务应该先进入哪个流程。

第二层是设计与计划层，由 `brainstorming` 和 `writing-plans` 构成。前者负责把模糊需求转成获得批准的 spec，后者负责把 spec 变成低上下文、可执行、可验证的任务序列。

第三层是执行与验证层，包括 `subagent-driven-development`、`executing-plans` 和 `verification-before-completion`。这一层不再处理“要不要这样做”，而是处理“如何按既定 plan 执行”和“如何在完成前给出证据”。

这类分层带来一个直接后果：skill 之间不是并列菜单关系，而是前置关系。`brainstorming` 的终点被定义为 `writing-plans`；`writing-plans` 的执行交接又明确分成 `subagent-driven-development` 和 `executing-plans` 两条路径；`verification-before-completion` 则像一道终态检查，拦住没有新鲜验证证据就宣称完成的做法。

从这个角度看，`superpowers` 的重点不在 skill 数量，而在每一层怎样收紧下一层的自由度。它想减少的，不是模型能做的事，而是模型在错误时机做事的机会。

## `writing-plans` 是 spec 到执行之间的桥

`brainstorming` 的终点不是代码，而是 spec。真正把 spec 送到实现层的，是 `writing-plans`。

这个 skill 的要求相当具体。它不是让人“写一个大致计划”，而是要求假设执行者几乎不了解当前仓库和问题域，然后把要改的文件、每个任务的职责、验证命令、预期输出，甚至一步一步的任务粒度，都提前写清楚。它反复强调 exact file paths、exact commands、bite-sized tasks，以及“不要写成 add validation 这种抽象动作”。

这说明 `writing-plans` 在体系里的作用，不是补一份文档，而是把设计阶段的意图压缩成可执行接口。前面的 spec 回答“要做什么”和“为什么这么做”，而 plan 回答“具体改哪些文件、按什么顺序改、怎么判断每一步完成了”。

这一层也解释了为什么 `superpowers` 会坚持 spec review loop。因为 plan 的前提，是 spec 已经足够稳定。否则，一个还不稳定的 spec，会被 `writing-plans` 很认真地翻译成一个同样不稳、但执行成本更高的任务列表。

再往后，`writing-plans` 并不自己执行，它只负责把执行入口切到两种模式之一：如果适合在当前 session 中按任务推进，而且任务大多相互独立，就进入 `subagent-driven-development`；否则进入 `executing-plans`。所以，`writing-plans` 不是附属技能，而是整条工作流从设计阶段切向执行阶段的桥接点。

## 多 agent 在这里不是默认并行，而是受限协作

`superpowers` 里确实有明显的多 agent 设计，但它和“多开几个 agent 一起干活”不是一回事。当前 skill 文档里，至少能看出两种不同的协作模式。

第一种是 `dispatching-parallel-agents`。它适用于多个问题域彼此独立、没有共享状态、可以并行调查的情况。这个 skill 的核心前提不是“任务很多”，而是“彼此独立”。文档里也明确列出不适用场景，比如问题彼此相关、必须先理解完整系统状态、或者多个 agent 会互相干扰。也就是说，这是一种有条件的并行化策略，不是默认调度器。

第二种是 `subagent-driven-development`。它虽然也使用多个 agent，但逻辑不是横向并行，而是纵向闭环：同一个 task 先交给 implementer subagent，再交给 spec reviewer，再交给 code quality reviewer，而且 review 顺序不能反过来。skill 文档把这一点写得很明确：先做 spec compliance review，再做 code quality review。

这条顺序的意义在于，先确认有没有偏离 spec，再讨论实现质量。如果连需求边界都没有对齐，太早去谈代码整洁度，只会掩盖问题。这也是为什么 `subagent-driven-development` 强调 fresh subagent per task。实现者、规范审查者、质量审查者各自带着不同目标进入，同一会话里累积下来的语境不会无差别传给所有角色。

从文档描述来看，这种上下文隔离本身就是设计重点。controller 负责准备精确上下文，而不是让子 agent 继承整段历史，或者自己去仓库里漫游。这样做的代价，是控制层工作会更多；但收益也很清楚：每个 agent 的任务边界更窄，判断目标更单一，review 也更容易分辨“按 spec 做错了”和“实现方式不稳妥”这两类不同问题。

`executing-plans` 则更像另一条执行支路。当前 skill 文档也说得很明白：如果平台支持 subagents，通常更推荐 `subagent-driven-development`；而 `executing-plans` 面向的是按 plan 顺序在一个执行会话里推进任务的场景。它的重点是先批判性 review plan，再逐 task 执行，并在全部完成后进入收尾流程。

所以，多 agent 在 `superpowers` 里的重点不是“越多越快”，而是“什么时候该并行隔离，什么时候该串行审查，什么时候该把上下文拆给不同角色”。这套体系真正要压低的，是错误传播，而不是表面上的同时开工数量。

## 一条典型执行路径

如果把前面几层压成一条运行路径，大致会是这样：

用户提出一个实现请求后，`using-superpowers` 先判断相关 skill，并拦住无流程行动；`brainstorming` 负责把请求整理成经过批准的设计和 spec；`writing-plans` 再把 spec 翻译成可执行的任务序列；之后根据任务独立性和执行环境，进入 `subagent-driven-development` 或 `executing-plans`；最后在宣称完成之前，必须经过 `verification-before-completion` 的证据门。

这条路径有个很明显的特点：每一层都不接受上一层那种“应该差不多了”的主观判断。设计要写成 spec，spec 要被 review，plan 要写到精确路径和命令，执行完成不能只靠感觉，完成声明要靠新鲜验证输出支撑。它看起来更慢，但本质上是在把“我以为”换成“我能证明”。

## 代价、边界与适用性

这套方法当然有成本。

首先，起步会明显更慢。对于已经习惯直接提示模型改代码的人来说，`brainstorming`、spec、plan、review loop 都会显得冗长。其次，文档和 review 本身也有开销，尤其在任务很小的时候，流程成本可能接近甚至超过实现成本。再者，这套体系对支持 subagent 的环境更友好，一些设计在没有子代理能力的平台上会失去一部分价值。

但它换来的东西也很明确。第一，它能更早暴露需求误解。第二，它会把计划缺口尽量提前到执行之前。第三，它对“完成幻觉”的防御更强，因为 `verification-before-completion` 直接把“没有新鲜证据就不能声称完成”写成了铁律。

所以，`superpowers` 并不适合被理解成一个普适效率插件。它更像一套强化工程纪律的框架：当任务复杂度、协作成本和返工代价上升时，这些额外门禁会开始变得划算；当任务很小、边界又清楚时，它的流程成本也会显得更明显。

## 一个更稳妥的理解顺序

如果准备真正使用这套体系，一个更稳妥的顺序不是先追求多 agent，而是先理解它限制了什么。

第一步，先理解 `using-superpowers` 为什么坚持“先判定 skill，再行动”。这一层决定你是否接受流程优先于直觉。

第二步，理解 `brainstorming` 为什么要在实现前增加一整套澄清、方案比较、批准、spec 和 review 的流程。它拖慢起步，但也把大量返工前移成设计问题。

第三步，再看 `writing-plans` 如何把 spec 变成精确任务，以及为什么执行阶段还要继续拆成不同角色和不同 review gate。

到了这一步，再引入 `dispatching-parallel-agents` 或 `subagent-driven-development`，通常会更容易看清它们到底在解决什么问题。否则，多 agent 很容易被误解成一种更贵的“同时开写”，而不是一套对上下文、职责和验证顺序做了严格限制的协作机制。

从当前这些 skill 文档来看，`superpowers` 并不是一份 prompt 收藏夹。它更像一套把 AI 编码过程拆成若干受控阶段的工作流系统。真正值得注意的，也不是某一个 skill 本身，而是这些 skill 怎样把“先设计、再计划、后执行、最后验证”写成不太能跳过的约束。
