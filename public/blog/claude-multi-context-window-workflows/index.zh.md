---
title: Claude 多上下文窗口工作流
---

原文来源：[Prompting best practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices) 文档中的 `Multi-context window workflows` 相关章节。

这篇转载只保留了和 agent harness 设计最相关的部分：长时间推理与状态跟踪、上下文感知、多上下文窗口工作流，以及状态管理建议。

## 长时间推理与状态跟踪

Claude 的新模型在长时间推理任务上表现得更好，也更擅长在长任务里维持状态。它在较长的 session 中，不是试图一次做完所有事情，而是更倾向于围绕少量目标做持续、增量的推进。这个能力在多上下文窗口或者多轮 task iteration 里尤其明显：Claude 可以围绕一个复杂任务工作、保存状态、再在一个新的上下文窗口里继续接着做。

## 上下文感知与多窗口工作流

Claude 4.6 和 Claude 4.5 模型具备上下文感知能力，也就是说，它能够在对话中追踪自己当前剩余的上下文窗口空间。这会帮助 Claude 更有效地执行任务和管理上下文，因为它知道自己还剩下多少空间可以继续工作。

如果 Claude 被放进一个会自动压缩上下文、或者允许把状态保存到外部文件的 agent harness 里，就可以在 prompt 里直接把这件事告诉它。否则，Claude 有时会在接近上下文上限时自然地开始收尾。

例如：

```text
Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully, even if the end of your budget is approaching. Never artificially stop any task early regardless of the context remaining.
```

## 多上下文窗口工作流

对于会跨多个上下文窗口的任务，文档给出了几条比较直接的建议：

1. 第一个上下文窗口使用不同的 prompt。第一轮更适合搭框架，例如写测试、生成初始化脚本；后续窗口再围绕 todo list 做增量推进。
2. 让模型用结构化格式记录测试。比如要求 Claude 先生成测试，再用 `tests.json` 这类结构化文件持续维护状态。
3. 预先准备质量改进工具。例如让 Claude 生成 `init.sh` 之类的脚本，用来启动服务、运行测试和 linter，减少后续重复劳动。
4. 在某些情况下，重新开始一个全新的上下文窗口，可能比继续使用压缩后的上下文更合适。
5. 提供验证工具。随着任务时长增加，Claude 需要在没有持续人工反馈的情况下验证结果是否正确。
6. 鼓励完整利用上下文。让模型持续推进，直到某个阶段真正完成，而不是提前收尾。

例如：

```text
This is a very long task, so it may be beneficial to plan out your work clearly. It's encouraged to spend your entire output context working on the task - just make sure you don't run out of context with significant uncommitted work. Continue working systematically until you have completed this task.
```

## 状态管理建议

文档里对状态管理给出的建议也比较直接：

- 结构化状态数据用结构化格式存。例如测试结果、任务状态这类内容，更适合放进 JSON 之类的格式里。
- 进度说明用非结构化文本即可。自由文本的 progress notes 对一般进展记录和上下文交接已经足够。
- 用 git 来记录状态。git 可以提供已经完成工作的日志，也可以提供可恢复的检查点。
- 明确强调增量推进。直接要求 Claude 跟踪自己的进度，并专注于逐步推进工作。

示例 `tests.json`：

```json
{
  "tests": [
    { "id": 1, "name": "authentication_flow", "status": "passing" },
    { "id": 2, "name": "user_management", "status": "failing" },
    { "id": 3, "name": "api_endpoints", "status": "not_started" }
  ],
  "total": 200,
  "passing": 150,
  "failing": 25,
  "not_started": 25
}
```

示例 `progress.txt`：

```text
Session 3 progress:
- Fixed authentication token validation
- Updated user model to handle edge cases
- Next: investigate user_management test failures (test #2)
- Note: Do not remove tests as this could lead to missing functionality
```

## 简短说明

如果把这几条建议放在一起看，会发现它们并不是某种很复杂的 agent 理论，而是比较朴素的工程组织方式：

- 第一轮先搭好工作框架；
- 后续轮次做增量推进；
- 用结构化文件保留状态；
- 用脚本减少重复劳动；
- 用验证工具补足长任务里的反馈回路。

这也是为什么这一节虽然出现在 Claude 的 prompting 文档里，但对多轮 coding harness、长任务 agent 和本地工作流设计同样有参考价值。
