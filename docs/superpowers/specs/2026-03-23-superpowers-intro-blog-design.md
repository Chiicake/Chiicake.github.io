# Superpowers 介绍博客设计文档

## 目标

产出一篇面向进阶 AI Coding 用户的中文技术博客，系统介绍 `superpowers` 的工作流设计，重点覆盖多 agent 系统、skills 之间的前后关系、`brainstorming` 工作流，以及这套体系为什么更像工程流程约束而不是普通 prompt 集合。

这篇文章将作为站内原创文章发布，遵循当前博客仓库的双语发布结构，但本次设计文档只定义中文主稿的内容策略、结构和证据来源。

## 读者与用途

- 读者：已经在使用 Claude Code、OpenCode、Codex CLI 或类似工具的进阶用户
- 用途：帮助读者理解 `superpowers` 的系统设计，而不是只学会几个命令名
- 成功标准：读者读完后，能够回答三个问题
  - `superpowers` 为什么不是零散 skill 集合
  - `brainstorming -> spec -> plan -> execute -> verify` 为什么被设计成强约束链路
  - 多 agent 在这套体系里何时应该并行，何时必须串行

## 文章定位

文章定位为“体系解析”而非“安装教程”。

不以安装命令或使用演示作为主线，而是从一条完整工作流切入，逐步解释每个环节承担的职责、输入输出、门禁条件和成本。文章应尽量让读者看到：`superpowers` 真正提供的是一套把不稳定的 AI 编码过程变成可审查、可回顾、可验证流程的组织方式。

## 核心论点

### 论点一：`superpowers` 解决的核心问题不是“模型不会写代码”，而是“模型会在没有流程约束时过早行动”

文章需要明确指出，很多 AI Coding 失败并不是出在语法层面，而是出在需求尚未澄清、设计未冻结、计划未分解、验证未执行时就开始实现。`using-superpowers` 和 `brainstorming` 的存在，都是为了阻止这种过早行动。

### 论点二：skills 之间存在分层关系，而不是并列菜单关系

文章需要强调：

- `using-superpowers` 是入口规则和 skill 调度约束
- `brainstorming` 是设计门禁
- `writing-plans` 是把 spec 展开成可执行任务的桥梁
- `subagent-driven-development` 与 `executing-plans` 是两条执行分支
- `verification-before-completion` 是完成声明前的证据门

因此，真正值得介绍的不是 skill 名单，而是它们之间的依赖与顺序。

### 论点三：多 agent 是受约束的执行策略，不是默认答案

文章需要区分两类多 agent 方式：

- `dispatching-parallel-agents` 处理彼此独立的问题域
- `subagent-driven-development` 处理按 plan 顺序推进的实现任务，并在每个任务后加入 spec review 与 code quality review

这里的重点不是“更多 agent 更快”，而是“上下文隔离、职责拆分和 review 顺序”如何降低错误传播。

## 证据来源与可引用材料

### 本地一手材料

以下内容可以作为文章主证据来源：

- `~/.agents/skills/superpowers/using-superpowers/SKILL.md`
  - 先判定 skill 再行动
  - process skills 优先于 implementation skills
  - 明确列出一组常见理性化借口
- `~/.agents/skills/superpowers/brainstorming/SKILL.md`
  - 创意与实现之间的硬门禁
  - 一次一个问题
  - 2-3 个方案比较
  - 设计批准后再写 spec
  - spec review loop 与 user review gate
- `~/.agents/skills/superpowers/writing-plans/SKILL.md`
  - bite-sized tasks
  - 以精确文件路径和精确命令组织计划
  - 默认引导至 `subagent-driven-development` 或 `executing-plans`
- `~/.agents/skills/superpowers/subagent-driven-development/SKILL.md`
  - 适用于当前 session 中、且 task 大多相互独立的 plan 执行
  - 每个 task 使用 fresh subagent
  - 两阶段 review：spec compliance -> code quality
  - 控制器负责准备上下文，而不是让子 agent 自己漫游读取全部信息
- `~/.agents/skills/superpowers/executing-plans/SKILL.md`
  - 作为另一条执行分支存在
  - 更适合不走 subagent-driven-development 的 plan 执行场景
  - 明确要求先 review plan，再逐 task 执行，并在结束前进入 finishing 阶段
- `~/.agents/skills/superpowers/dispatching-parallel-agents/SKILL.md`
  - 仅在问题域独立时并行
  - 强调 prompt scope 和上下文边界
- `~/.agents/skills/superpowers/verification-before-completion/SKILL.md`
  - “evidence before claims”
  - 没有新鲜验证输出就不能声称完成

### 仓库内发布与风格参考

- `public/blog/impeccable-ai-frontend-design-skill/index.zh.md`
  - 参考写法：先讲问题，再讲组成、命令、上下文与边界
- `public/blog/index.json`
  - 当前可复用分类：`ai`
  - 当前可复用标签：`AI Tools`
- `scripts/publish_blog.py`
  - 当前原创文章发布流程
  - 双语结构与元数据组织方式

### 外部资料使用策略

用户提到 `zread`、`deepwiki` 和 GitHub 仓库详解，因此成稿可以在引言或背景段落中提及 Claude Code 存在更大的 agent/tool/skill 体系背景；但涉及 `superpowers` 具体规则、门禁、前后依赖和执行分支时，必须回到本地 skill 文档，不允许用未直接核实的外部页面内容支撑关键结论。

换言之：外部资料只作为背景，不作为这篇文章的事实主干。

## 不写什么

为保证文章聚焦，以下内容不作为主线展开：

- 不写成安装教程
- 不枚举所有 superpowers skills 的逐条说明书
- 不把 `superpowers` 与所有其他 agent 框架做泛泛对比
- 不对外部站点未验证的实现细节做断言
- 不夸大“多 agent 一定更快”或“用了就能写出高质量代码”

## 结构设计

### 第一部分：用一条工作流链路开场

文章开头先给出一个紧凑但完整的链路示例，例如：

```text
using-superpowers
  -> brainstorming
  -> design/spec
  -> writing-plans
  -> subagent-driven-development
  -> verification-before-completion
```

开场目的不是解释每个节点，而是先让读者看到：`superpowers` 更像一条流水线，而不是一组独立命令。开头应直接指出，这套体系试图解决的问题是“AI 过早开始实现”，而不是“AI 不会写代码”。

### 第二部分：为什么它先管流程，再管能力

这一部分围绕 `using-superpowers` 展开，解释两个核心机制：

- 只要存在适用 skill，就必须先调用 skill
- process skill 优先于 implementation skill

这一部分要说明，在传统使用方式里，用户和模型都倾向于立即动手；而 `superpowers` 的第一层设计，就是把“直接开始做”变成违规路径。

### 第三部分：`brainstorming` 为什么是硬门禁

这一部分是文章重点。需要拆解 `brainstorming` 的工作流：

- 先看上下文
- 一次只问一个问题
- 提出 2-3 个方案
- 分段展示设计并获得批准
- 写 spec
- 做 spec review loop
- 让用户 review spec
- 然后才进入 `writing-plans`

这一部分需要解释：`brainstorming` 的真正价值不是“想创意”，而是把模糊任务转成能被后续计划和 reviewer 检查的文档对象。

### 第四部分：skills 之间是分层依赖，而不是平铺插件

这一部分需要画出逻辑上的三层：

- 入口与流程控制层：`using-superpowers`
- 设计与计划层：`brainstorming`、`writing-plans`
- 执行与验证层：`subagent-driven-development`、`executing-plans`、`verification-before-completion`

这里可以适度对比很多 AI 工具里的“命令列表式”组织，指出 `superpowers` 的特点在于把前后依赖写进 skill 本身，而不是交给使用者记忆。

### 第五部分：多 agent 不是默认并行，而是受限协作

这一部分拆成两类：

1. `dispatching-parallel-agents`
   - 只在问题彼此独立时成立
   - 优势是并行调查与修复
   - 风险是共享状态冲突与错误合并

2. `subagent-driven-development`
   - 只适用于当前 session 中、且 task 大多相互独立的 plan 执行
   - 按 task 串行推进
   - 每个 task 一个 fresh implementer subagent
   - 每个 task 后面跟 spec reviewer 和 code quality reviewer
   - review 顺序固定，不能反过来

这一部分要强调，多 agent 系统的关键设计点不是 agent 数量，而是上下文隔离、任务边界和 review gate。

### 第六部分：一条典型执行路径

这一部分把前面几个概念串起来，写成读者易于理解的运行流程：

1. 用户提出实现请求
2. `using-superpowers` 判断相关 skill
3. `brainstorming` 做澄清与设计
4. 生成 spec 并 review
5. `writing-plans` 把 spec 变成可执行任务
6. 根据任务耦合度与执行环境，选择 `subagent-driven-development` 或 `executing-plans`
7. 完成前执行 `verification-before-completion`

这一部分的目标是让读者把整套体系看成一个受控状态机。此节应控制篇幅，定位为前文的串联示例，而不是重复枚举每个 skill。

### 第七部分：这套体系的成本与边界

必须明确写出成本：

- 起步更慢
- 文档与 review 开销更高
- 不适合所有临时性任务
- 对支持 subagent 的环境更友好

同时也要写出价值：

- 把“需求误解”暴露在编码之前
- 把“计划缺口”暴露在执行之前
- 把“完成幻觉”暴露在提交之前

这一部分会让文章更平衡，不至于像推介文。

### 结尾：给进阶用户的上手建议

结尾不做空泛总结，而给出可执行建议：

- 先理解 `using-superpowers` 在限制什么
- 再理解 `brainstorming` 为什么拖慢起步但提高后续稳定性
- 最后再引入多 agent 执行，而不是一上来追求并行

## 标题、摘要与元数据建议

### 标题候选

首选：`Superpowers 工作流解析：多 Agent、Skills 关联与 Brainstorm 门禁`

备选：

- `Superpowers：一套面向 AI Coding 的工程工作流系统`
- `从 Brainstorm 到多 Agent 执行：Superpowers 的工作流设计`

### 摘要候选

`介绍 Superpowers 如何通过 skills 分层、brainstorm 门禁、计划生成与多 agent review，把 AI Coding 过程组织成可验证的工程工作流。`

### 分类与标签建议

- category: `ai`
- tags: `AI Tools`
- 可考虑新增标签：`Workflows`

是否新增 `Workflows` 取决于发布时是否希望扩充标签集合；如果不希望新增，保留 `AI Tools` 即可。

## 写作风格要求

- 中文主稿使用直接、技术化、低宣传色彩的表达
- 每一节先给一个具体规则、流程片段或判断标准，再解释其设计动机
- 句子尽量短，避免口号式表达
- 不使用“革命性”“强大”“优雅”之类无证据形容词
- 对未直接验证的信息一律降格表达，例如“从当前 skill 文档可见”“按这套规则设计”

## 断言与来源映射要求

为避免成稿在复述过程中偏离原始约束，正文每个核心部分都应隐含一层“断言 -> 来源”映射。至少满足以下要求：

- 关于“必须”“只能”“不能”“先于”“门禁”这类强约束表述，必须对应到具体本地 skill 文档
- 介绍 `brainstorming` 工作流时，核心断言应主要锚定 `brainstorming` 和 `using-superpowers`
- 介绍执行分支时，核心断言应主要锚定 `writing-plans`、`subagent-driven-development`、`executing-plans`
- 介绍完成前验证时，核心断言应锚定 `verification-before-completion`

写作时不需要把所有来源直接写成学术注释格式，但作者必须能说明每个核心判断来自哪份本地 skill 文档。

## 交付物

本设计通过后，后续交付应包括：

1. 中文主稿
2. 与中文结构对齐的英文版本
3. 发布所需元数据建议（slug、summary、category、tags）
4. 如有需要，可补一张简单流程图，但不是必须项

## 风险与检查项

### 风险

- 文章可能滑向“列 skill 清单”的说明书写法
- 文章可能因为资料来源限制而把外部资料写得过重
- 文章可能过度强调多 agent，而忽略前面更核心的流程门禁

### 检查项

- 是否在开头就给出完整链路，而不是先写背景废话
- 是否把 `brainstorming` 写成核心，而不是附带提及
- 是否明确写出 skill 层次关系
- 是否说明并行 agent 与串行 review 的边界
- 是否明确标出成本与局限
