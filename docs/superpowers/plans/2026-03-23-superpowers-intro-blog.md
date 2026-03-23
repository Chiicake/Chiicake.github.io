# Superpowers Intro Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new bilingual original blog post that explains `superpowers` as a workflow system for advanced AI coding users, centered on skill relationships, brainstorming gates, and constrained multi-agent execution.

**Architecture:** The work splits into four deliverables: finalized metadata, a Chinese source article grounded in local skill documents, a matching English translation aligned section-by-section, and a `public/blog/index.json` entry consistent with the repository's existing blog schema. The implementation should follow the repository's original-post workflow and keep factual claims tied to verified local sources.

**Tech Stack:** Markdown, JSON metadata, existing blog publishing structure under `public/blog/`, local repository conventions from `AGENTS.md`

---

## File Structure

- Create: `public/blog/superpowers-workflow-analysis/index.zh.md`
  - Chinese source article and canonical structure for the post
- Create: `public/blog/superpowers-workflow-analysis/index.en.md`
  - English counterpart aligned with the Chinese version
- Modify: `public/blog/index.json`
  - Register article metadata under the `ai` category with existing tags unless expansion is justified
- Reference: `docs/superpowers/specs/2026-03-23-superpowers-intro-blog-design.md`
  - Approved design spec that constrains scope and evidence strategy
- Reference: `public/blog/impeccable-ai-frontend-design-skill/index.zh.md`
  - Style and structure reference for AI-tool analysis posts in this repo

### Task 1: Finalize post metadata and publishing choices

**Files:**
- Modify: `public/blog/index.json`
- Create: `public/blog/superpowers-workflow-analysis/index.zh.md`
- Create: `public/blog/superpowers-workflow-analysis/index.en.md`

- [ ] **Step 1: Inspect the repository's actual original-post workflow before drafting**

Read and copy conventions from these exact sources before writing anything:

- `scripts/publish_blog.py`
- `public/blog/index.json`
- `public/blog/impeccable-ai-frontend-design-skill/index.zh.md`
- `public/blog/impeccable-ai-frontend-design-skill/index.en.md`

Record the exact conventions that matter:

- article directory naming
- markdown file naming (`index.zh.md`, `index.en.md`)
- frontmatter shape used by existing original posts
- `public/blog/index.json` schema for original articles
- `readingTime` string format in both languages

Expected: the worker has a concrete schema and file-format template copied from the repo rather than inferred from memory.

- [ ] **Step 2: Confirm metadata values from the approved spec**

Decide and write down the exact metadata to be used in the article files and `public/blog/index.json`:

- slug: `superpowers-workflow-analysis`
- title zh: `Superpowers 工作流解析：多 Agent、Skills 关联与 Brainstorm 门禁`
- title en: `Superpowers Workflow Analysis: Multi-Agent Coordination, Skill Relationships, and Brainstorm Gates`
- summary zh: `介绍 Superpowers 如何通过 skills 分层、brainstorm 门禁、计划生成与多 agent review，把 AI Coding 过程组织成可验证的工程工作流。`
- summary en: `An analysis of how Superpowers uses skill layering, brainstorming gates, planning, and multi-agent review to turn AI coding into a verifiable engineering workflow.`
- category: `ai`
- tags: `["AI Tools"]`
- contentType: `original`
- date: `2026-03-23`

- [ ] **Step 3: Verify metadata choices match repository conventions**

Run checks by reading the existing article entries and category/tag definitions in `public/blog/index.json`.

Expected: The chosen category already exists, the `AI Tools` tag already exists, and no repost-only fields are required.

- [ ] **Step 4: Lock the article structure before drafting**

Write a compact section map derived from the spec and keep it as the drafting checklist:

1. concrete workflow-chain opening
2. why Superpowers constrains process before implementation
3. why `brainstorming` is the main gate
4. why skills are layered rather than flat
5. how multi-agent execution is constrained
6. a concise end-to-end execution path
7. costs, boundaries, and practical advice

- [ ] **Step 5: Record commit policy for this execution**

Because this repository workflow only allows commits when explicitly requested by the user, mark all commit steps in this plan as optional execution notes. Do not run any `git commit` command unless the user later asks for it.

Expected: the worker treats commit snippets as optional references, not default actions.

- [ ] **Step 6: Optional commit planning checkpoint**

```bash
git add docs/superpowers/specs/2026-03-23-superpowers-intro-blog-design.md docs/superpowers/plans/2026-03-23-superpowers-intro-blog.md
git commit -m "Plan superpowers workflow analysis post"
```

Expected: Run only if the user explicitly asks for commits. Otherwise skip.

### Task 2: Write the Chinese source article

**Files:**
- Create: `public/blog/superpowers-workflow-analysis/index.zh.md`
- Reference: `docs/superpowers/specs/2026-03-23-superpowers-intro-blog-design.md`
- Reference: `public/blog/impeccable-ai-frontend-design-skill/index.zh.md`

- [ ] **Step 1: Draft the opening section with a concrete workflow chain**

Open the article with a compact workflow example such as:

```text
using-superpowers
  -> brainstorming
  -> spec
  -> writing-plans
  -> subagent-driven-development
  -> verification-before-completion
```

Then explain that the main problem is not that the model cannot write code, but that it tends to act before requirements, design, plans, and verification are in place.

- [ ] **Step 2: Write the section on `using-superpowers` and process-first control**

Ground the section in `~/.agents/skills/superpowers/using-superpowers/SKILL.md`. Include these verified ideas only:

- relevant skills must be invoked before acting
- process skills come before implementation skills
- the skill explicitly treats “let me inspect first” or “this is simple” as rationalization patterns

Do not generalize beyond what the local skill text supports.

- [ ] **Step 3: Write the `brainstorming` section as the article's main analytical center**

Ground the section in `~/.agents/skills/superpowers/brainstorming/SKILL.md`. Cover:

- hard gate before implementation
- one question at a time
- 2-3 approaches with trade-offs
- design approval before spec writing
- spec review loop and user review gate

Explain why this is less about creativity and more about converting vague requests into reviewable artifacts.

- [ ] **Step 4: Write the skills-layering section**

Show the three logical layers:

- control: `using-superpowers`
- design/planning: `brainstorming`, `writing-plans`
- execution/verification: `subagent-driven-development`, `executing-plans`, `verification-before-completion`

Use the layering to argue that `superpowers` should be read as a workflow graph, not as a flat command catalog.

- [ ] **Step 5: Add a dedicated `writing-plans` bridge section**

Ground this section in `~/.agents/skills/superpowers/writing-plans/SKILL.md`. Cover its specific bridge role:

- why the approved spec is not the terminal artifact
- how `writing-plans` converts spec into executable, low-context steps
- why it insists on exact file paths, exact commands, and bite-sized tasks
- why execution then branches into `subagent-driven-development` or `executing-plans`

Explain this as the transition from design-time discipline to implementation-time discipline.

- [ ] **Step 6: Write the multi-agent section with strict boundaries**

Ground claims in:

- `~/.agents/skills/superpowers/dispatching-parallel-agents/SKILL.md`
- `~/.agents/skills/superpowers/subagent-driven-development/SKILL.md`
- `~/.agents/skills/superpowers/executing-plans/SKILL.md`

The section must distinguish:

- independent-domain parallelism via `dispatching-parallel-agents`
- mostly-independent same-session task execution via `subagent-driven-development`
- plan execution without that branch via `executing-plans`

Also include the fixed review order in `subagent-driven-development`: spec compliance first, code quality second.

- [ ] **Step 7: Write the synthesis path and closing sections**

Add:

- a short, non-repetitive end-to-end execution path
- a balanced section on costs and limits
- practical advice for advanced users starting with the process layer rather than immediately chasing parallelism

- [ ] **Step 8: Self-check the Chinese article against the spec and source conventions**

Create a checklist and verify:

- opening is concrete, not generic
- `brainstorming` is the main gate, not a side note
- `writing-plans` is clearly explained as the spec-to-execution bridge
- strong claims map to local skill documents
- external sources are not used as unsupported evidence
- tone stays factual and low-hype
- frontmatter matches the exact shape used by the reference original post

- [ ] **Step 9: Save the finished Chinese draft with exact repo-compatible frontmatter**

Write the full article to `public/blog/superpowers-workflow-analysis/index.zh.md` using the exact frontmatter pattern copied from the closest existing original bilingual post. At minimum, use the same title-only frontmatter shape if that is what the inspected reference file uses.

- [ ] **Step 10: Optional Chinese draft commit checkpoint**

```bash
git add public/blog/superpowers-workflow-analysis/index.zh.md
git commit -m "Draft superpowers workflow analysis in Chinese"
```

Expected: Run only if the user explicitly asks for commits. Otherwise skip.

### Task 3: Write the English counterpart

**Files:**
- Create: `public/blog/superpowers-workflow-analysis/index.en.md`
- Reference: `public/blog/superpowers-workflow-analysis/index.zh.md`

- [ ] **Step 1: Mirror the Chinese section structure exactly**

Use the Chinese article as the source of truth. Keep heading order, conceptual emphasis, and the claim boundaries aligned.

- [ ] **Step 2: Translate for clarity, not literal symmetry**

Produce natural English that preserves the factual meaning. Keep the tone similar to `public/blog/impeccable-ai-frontend-design-skill/index.en.md`: direct, explanatory, and technical.

- [ ] **Step 3: Preserve the same evidence boundaries**

Do not introduce new claims in English that are absent or less certain in the Chinese source. Maintain the same caution around external materials and applicability boundaries.

- [ ] **Step 4: Save the English draft**

Write the full article to `public/blog/superpowers-workflow-analysis/index.en.md` using the exact same frontmatter shape as the Chinese file, with the English title value.

- [ ] **Step 5: Optional English draft commit checkpoint**

```bash
git add public/blog/superpowers-workflow-analysis/index.en.md
git commit -m "Add English version of superpowers workflow analysis"
```

Expected: Run only if the user explicitly asks for commits. Otherwise skip.

### Task 4: Register metadata and verify repository compatibility

**Files:**
- Modify: `public/blog/index.json`
- Test: `public/blog/superpowers-workflow-analysis/index.zh.md`
- Test: `public/blog/superpowers-workflow-analysis/index.en.md`

- [ ] **Step 1: Add the new article entry to `public/blog/index.json`**

Append a new article object with these fields:

```json
{
  "slug": "superpowers-workflow-analysis",
  "date": "2026-03-23",
  "tags": ["AI Tools"],
  "title": {
    "zh": "Superpowers 工作流解析：多 Agent、Skills 关联与 Brainstorm 门禁",
    "en": "Superpowers Workflow Analysis: Multi-Agent Coordination, Skill Relationships, and Brainstorm Gates"
  },
  "summary": {
    "zh": "介绍 Superpowers 如何通过 skills 分层、brainstorm 门禁、计划生成与多 agent review，把 AI Coding 过程组织成可验证的工程工作流。",
    "en": "An analysis of how Superpowers uses skill layering, brainstorming gates, planning, and multi-agent review to turn AI coding into a verifiable engineering workflow."
  },
  "readingTime": {
    "zh": "[computed] 分钟",
    "en": "[computed] min"
  },
  "category": "ai",
  "contentType": "original"
}
```

Use reading-time values consistent with the repository's format after drafting is complete.

Derive the final `readingTime` strings by comparing the new article length against nearby existing entries and then writing values in the exact existing format:

- zh: `N 分钟`
- en: `N min`

If other required fields appear in the closest matching original bilingual article entry, mirror them exactly unless the field is clearly article-specific.

- [ ] **Step 2: Verify article bundle structure**

Check that the new directory contains exactly the expected article files and that no repost-only fields or remote assets are introduced.

Expected: `index.zh.md` and `index.en.md` exist under `public/blog/superpowers-workflow-analysis/`.

- [ ] **Step 3: Verify the new entry matches the repo's publish schema**

Compare the new `public/blog/index.json` article object against at least one recent original bilingual article entry and against the normalization expectations implied by `scripts/publish_blog.py`.

Expected: required fields, field names, nested object shapes, and value formats all match the existing original-post schema.

- [ ] **Step 4: Run repository verification commands**

Run at minimum:

```bash
npm run lint
npm run build
```

If either command fails, stop and fix the issue before claiming completion.

Expected: both commands exit successfully.

- [ ] **Step 5: Verify metadata diff and article registration**

Run:

```bash
git diff -- public/blog/index.json public/blog/superpowers-workflow-analysis/index.zh.md public/blog/superpowers-workflow-analysis/index.en.md
```

Expected: diff shows only the intended new article bundle and index entry.

- [ ] **Step 6: Optional final commit**

```bash
git add public/blog/index.json public/blog/superpowers-workflow-analysis/index.zh.md public/blog/superpowers-workflow-analysis/index.en.md
git commit -m "Add superpowers workflow analysis post"
```

Expected: Run only if the user explicitly asks for commits. Otherwise skip.
