# Superpowers 工作流图设计文档

## 目标

为文章 `public/blog/superpowers-workflow-analysis/index.zh.md` 和 `public/blog/superpowers-workflow-analysis/index.en.md` 补一张 SVG 流程图，帮助读者在进入细节讨论前先理解 `superpowers` 的主链路。

这张图的作用是把文章中反复出现的流程关系可视化，而不是增加新的信息。读者看完图片后，应当能够快速识别：

- `using-superpowers` 是入口控制；
- `brainstorming` 是实现前的硬门禁；
- `writing-plans` 是从 spec 到 execution 的桥；
- 执行阶段存在两条分支；
- `verification-before-completion` 是结束前的证据门。

## 图的定位

这是文章中的“总览图”，不是细节图，也不是多 agent 专题图。

因此它应该优先服务于以下阅读目标：

1. 让读者一眼看出这是一个工作流系统，而不是 skill 列表；
2. 让读者知道执行分支出现在哪里；
3. 让读者知道哪些节点承担门禁作用；
4. 避免把图画成复杂状态机，以免压过正文。

## 推荐方案

采用“线性主链 + 分支节点图”。

### 主体结构

图的主体是一条自上而下的主链：

1. `using-superpowers`
2. `brainstorming`
3. `approved spec`
4. `writing-plans`
5. `execution branch`
6. `verification-before-completion`

其中第 5 个节点不是终点，而是一个分支入口。在这个节点下方或左右分出两个执行节点：

- `subagent-driven-development`
- `executing-plans`

两个执行节点都要回连或汇聚到 `verification-before-completion`，表示执行路径不同，但完成前验证要求相同。

这里需要明确：`approved spec` 不是 skill，而是流程检查点。它应当作为“状态节点”呈现，视觉上可以与 skill 节点保持同一几何形状，但填充色略浅，或在标签上加 `checkpoint` 的次级说明，以便读者看出它表示阶段性产物，而不是又一个 command/skill。

### 辅助注释

在主链右侧增加 3 个小型说明框，不与主链争夺视觉中心：

- `Process first`
- `Hard gate before implementation`
- `Evidence before claims`

这些注释分别对应：

- `using-superpowers`
- `brainstorming`
- `verification-before-completion`

说明框应当使用更轻的视觉权重，避免和主节点混淆。

## 版式设计

### 布局

- 使用纵向流程布局，适合博客正文中的自然阅读顺序；
- 画布比例应优先适配网页中的内容列宽，同时保持明显的纵向阅读感；
- 建议固定 `viewBox="0 0 960 720"`，对应约 4:3 的横纵比，既能容纳右侧注释框，也不会削弱自上而下的主链扫描；
- 主链节点居中对齐；
- 分支节点在 `execution branch` 下方横向展开，左右平衡；
- 注释框放在右侧，不遮挡箭头，不与主链产生交叉连线。

### 节点层级

- 主节点：圆角矩形，尺寸统一；
- 分支节点：比主节点略小，但仍然清晰；
- 注释框：更小、更淡、边框更轻；
- 箭头：使用统一方向和统一粗细，避免装饰性曲线。

### 文案

图标题：`Superpowers Workflow Chain`

节点文本采用英文，原因有二：

1. 文章正文中大量直接引用 skill 名称，本身就是英文；
2. 与现有站内技术图中的英文术语风格更一致。

但图片的 alt 文本在中英文文章中应分别本地化。

SVG 文件本身还应包含内嵌的 `<title>` 和 `<desc>`，用于基础可访问性。其中 `<title>` 使用英文，`<desc>` 用一两句英文描述“a top-down Superpowers workflow chain with an execution split and verification gate”，避免冗长。

## 视觉风格

遵循仓库对技术博客图示的现有要求：

- 背景使用浅色：`#ffffff` 或 `#fafafa`
- 文字和线条使用中性、低饱和颜色
- 避免高饱和色块和深色大底
- 保持专业、简洁、低装饰性

### 建议配色

- 背景：`#fafafa`
- 主节点填充：`#f1f3f5`
- 主节点描边：`#495057`
- 分支节点填充：`#f8f9fa`
- 注释框填充：`#ffffff`
- 注释框描边：`#adb5bd`
- 主文字：`#212529`
- 次级文字：`#495057`
- 箭头线条：`#343a40`

整张图不应依赖颜色来表达逻辑层次，颜色只做轻量区分。逻辑关系仍然主要靠布局、箭头和文本表达。

## 信息边界

这张图需要刻意省略一些内容，以避免过载：

- 不画 `spec review loop` 的循环箭头
- 不画 `user review gate` 的往返关系
- 不画 `dispatching-parallel-agents` 这类局部策略节点
- 不展开 `subagent-driven-development` 内部的 implementer/reviewer 细节
- 不画“是否适合 subagents”之类判断菱形

这些内容都存在于正文，但不适合放进总览图。总览图只负责建立主链和分支位置。

## 插入位置建议

建议把图片插入到中文和英文文章的“概述/Overview”部分，在工作流文本代码块之后、以“如果把 `superpowers` 只理解成一组可以随手调用的 skills”开头的中文段落之前，以及以“If `superpowers` is treated as a loose collection of callable skills”开头的英文段落之前。

原因：

- 文章一开始就给出了一条文本链；
- 紧接着放图，可以把文本链升级为更易扫描的总览；
- 后文读者再次遇到 `brainstorming`、`writing-plans`、`verification-before-completion` 时，会更容易在脑中回忆流程位置。

## 文件与落地方式

### 文件路径

- 资源文件：`public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg`
- 中文插图引用：`![Superpowers 工作流主链](./assets/superpowers-workflow-chain.svg)`
- 英文插图引用：`![Superpowers workflow chain](./assets/superpowers-workflow-chain.svg)`

### 文章改动

需要同时修改：

- `public/blog/superpowers-workflow-analysis/index.zh.md`
- `public/blog/superpowers-workflow-analysis/index.en.md`

修改内容只包括在概述部分插入图片引用，不调整正文结构。

更具体地说：

- 中文文件在第一个 ```text 工作流代码块结束后，空一行插入图片；
- 英文文件在第一个 ```text workflow code block 结束后，空一行插入图片；
- 图片后保留空行，再进入后续正文段落。

## 可读性要求

- 在桌面宽度下，节点文字无需放大即可识别；
- 在移动端内容列缩放后，主节点文字仍需可读；
- 箭头方向必须明显，不能依赖微小三角形判断；
- 分支节点与主链节点必须保持足够留白，防止视觉挤压；
- 标题与图形之间留有明确间距。

建议最小正文字号不低于 `22px`，标题字号在 `28px` 到 `32px` 之间。

## 实现要求

生成 SVG 时需要满足以下要求：

- 使用纯 SVG，不依赖外部字体、脚本或样式文件；
- 文本使用通用 sans-serif 回退；
- 所有尺寸、边距、箭头位置写死在 SVG 中，避免渲染不一致；
- 保持代码整洁，便于后续人工微调；
- 不添加与主题不相关的装饰元素。
- 连线优先使用直线 + 正交折线，不使用贝塞尔装饰曲线；
- 主节点和主箭头描边建议在 `2.5` 到 `3` 之间，注释框描边建议在 `1.5` 到 `2` 之间；
- 箭头头部尺寸需要在缩放后仍然清晰，不得小于主线宽度的 2 倍；
- SVG 根元素应包含 `<title>` 与 `<desc>`。

## 验收标准

图完成后，应满足以下检查项：

1. 一眼可以看出主链和执行分支；
2. `brainstorming` 的门禁角色和 `verification-before-completion` 的结束前角色能被注释提示；
3. 图在浅色和深色站点主题下都清晰可见；
4. 文章中的图片插入位置自然，不打断阅读；
5. SVG 文件在仓库内独立存在，不依赖远程资源。

## 风险与避免方式

### 风险一：画成过度复杂的状态机

避免方式：坚持主链 + 分支，不加入循环判断和 reviewer 内部细节。

### 风险二：文字过多导致移动端不可读

避免方式：主节点只保留 skill 名称或简短状态名，说明放到右侧注释框。

### 风险三：视觉上过于灰暗或过于花哨

避免方式：使用浅背景、低饱和中性色和统一描边，不加入强调色块。
