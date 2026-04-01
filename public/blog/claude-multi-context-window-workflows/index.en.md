---
title: Claude Multi-context Window Workflows
---

Original source: [Prompting best practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices), section "Multi-context window workflows".

This repost keeps only the long-horizon reasoning, context awareness, multi-context window workflow, and state management sections that are most relevant to agent harness design.

## Long-horizon reasoning and state tracking

Claude's latest models excel at long-horizon reasoning tasks with exceptional state tracking capabilities. Claude maintains orientation across extended sessions by focusing on incremental progress, making steady advances on a few things at a time rather than attempting everything at once. This capability especially emerges over multiple context windows or task iterations, where Claude can work on a complex task, save the state, and continue with a fresh context window.

## Context awareness and multi-window workflows

Claude 4.6 and Claude 4.5 models feature context awareness, enabling the model to track its remaining context window throughout a conversation. This enables Claude to execute tasks and manage context more effectively by understanding how much space it has to work.

If you are using Claude in an agent harness that compacts context or allows saving context to external files, consider adding this information to your prompt so Claude can behave accordingly. Otherwise, Claude may sometimes naturally try to wrap up work as it approaches the context limit.

Example prompt:

```text
Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully, even if the end of your budget is approaching. Never artificially stop any task early regardless of the context remaining.
```

## Multi-context window workflows

For tasks spanning multiple context windows:

1. Use a different prompt for the very first context window. Use the first context window to set up a framework, then use future context windows to iterate on a todo list.
2. Have the model write tests in a structured format. Ask Claude to create tests before starting work and keep track of them in a structured format such as `tests.json`.
3. Set up quality-of-life tools. Encourage Claude to create setup scripts such as `init.sh` to start servers and run test suites.
4. Consider starting fresh instead of compacting. When a context window is cleared, starting with a brand new context window can sometimes work better than continuing a compacted one.
5. Provide verification tools. As task length grows, Claude needs ways to verify correctness without continuous human feedback.
6. Encourage complete usage of context. Prompt Claude to work systematically and continue until the task is completed.

Example prompt:

```text
This is a very long task, so it may be beneficial to plan out your work clearly. It's encouraged to spend your entire output context working on the task - just make sure you don't run out of context with significant uncommitted work. Continue working systematically until you have completed this task.
```

## State management best practices

- Use structured formats for state data. When tracking structured information such as test results or task status, use JSON or other structured formats.
- Use unstructured text for progress notes. Freeform progress notes work well for tracking general progress and context.
- Use git for state tracking. Git provides a log of what has been done and checkpoints that can be restored.
- Emphasize incremental progress. Explicitly ask Claude to keep track of its progress and focus on incremental work.

Example `tests.json`:

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

Example `progress.txt`:

```text
Session 3 progress:
- Fixed authentication token validation
- Updated user model to handle edge cases
- Next: investigate user_management test failures (test #2)
- Note: Do not remove tests as this could lead to missing functionality
```
