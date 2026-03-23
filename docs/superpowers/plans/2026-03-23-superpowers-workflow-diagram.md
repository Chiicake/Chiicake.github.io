# Superpowers Workflow Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-compatible SVG overview diagram to the Superpowers article and insert it into both language versions at the approved location.

**Architecture:** The work has three deliverables: a single standalone SVG asset under the article's `assets/` directory, a Chinese Markdown insertion, and an English Markdown insertion. The SVG should express the approved top-down workflow chain with one execution split, using a light technical-diagram style consistent with existing blog assets.

**Tech Stack:** SVG, Markdown, existing blog article structure under `public/blog/`, approved spec in `docs/superpowers/specs/`

---

## File Structure

- Create: `public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg`
  - Standalone workflow overview diagram used by both language versions
- Modify: `public/blog/superpowers-workflow-analysis/index.zh.md`
  - Insert localized Markdown image reference after the opening workflow code block
- Modify: `public/blog/superpowers-workflow-analysis/index.en.md`
  - Insert localized Markdown image reference after the opening workflow code block
- Reference: `docs/superpowers/specs/2026-03-23-superpowers-workflow-diagram-design.md`
  - Approved diagram design spec with layout, style, and accessibility constraints
- Reference: `public/blog/modernizing-go-code-with-go-fix/assets/gofix-analysis-facts.svg`
  - Existing repo SVG style reference with structured nodes and arrows
- Reference: `public/blog/chacha20-poly1305-deep-dive/assets/chacha20-poly1305-aead.svg`
  - Existing handwritten SVG style reference with simple inline styles and light background

### Task 1: Build the SVG asset

**Files:**
- Create: `public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg`
- Reference: `docs/superpowers/specs/2026-03-23-superpowers-workflow-diagram-design.md`

- [ ] **Step 1: Create the SVG shell with fixed canvas and accessibility metadata**

Create the root SVG with:

- `viewBox="0 0 960 720"`
- a light background rectangle using `#fafafa` or `#ffffff`
- embedded `<title>` with `Superpowers Workflow Chain`
- embedded `<desc>` describing a top-down workflow with an execution split and a verification gate

Expected: the file opens as a valid standalone SVG without external dependencies.

- [ ] **Step 2: Define reusable styles and arrow marker**

Add internal `<style>` rules or equivalent inline styles for:

- title text
- primary node text
- secondary checkpoint text
- note-box text
- main node rectangles
- checkpoint node rectangle
- branch node rectangles
- note boxes
- connector lines
- arrowheads

Use only neutral colors from the approved spec. Keep primary stroke widths in the `2.5` to `3` range and note-box strokes in the `1.5` to `2` range.

Expected: all visual tokens are controlled inside the SVG file.

- [ ] **Step 3: Draw the title and the vertical main chain**

Create the centered title and these top-down nodes:

1. `using-superpowers`
2. `brainstorming`
3. `approved spec`
4. `writing-plans`
5. `execution branch`
6. `verification-before-completion`

Render `approved spec` as a checkpoint node, not as a peer skill node. It may keep the same rounded-rectangle geometry, but must be visually lighter or carry a small `checkpoint` sublabel.

Expected: the main reading direction is clear before any branch detail is added.

- [ ] **Step 4: Apply fixed geometry for layout and routing**

Use concrete geometry so the SVG does not depend on improvised placement:

- title centered near `y=54`
- main node width about `280`, height about `64`, centered around `x=340`
- checkpoint node uses the same box size but lighter fill
- vertical gap between main nodes about `34` to `42`
- branch hub node sits above two branch nodes
- branch node width about `240`, height about `56`
- left branch centered near `x=120`, right branch centered near `x=600`
- note-box column placed on the right around `x=700` with widths about `200` to `210`
- connectors use straight segments and orthogonal elbows only

Expected: layout is deterministic and stays close to the approved composition.

- [ ] **Step 5: Add the execution split and return path**

Below `execution branch`, add two smaller sibling nodes:

- `subagent-driven-development`
- `executing-plans`

Connect both branches into the bottom `verification-before-completion` node using straight or orthogonal connectors. Do not use decorative curves.

Expected: the branch relationship is readable in one scan and still resolves back to the same verification gate.

- [ ] **Step 6: Add the three note boxes with explicit node mapping**

Place three lighter note boxes on the right side, aligned to the relevant parts of the chain:

- `Process first` aligned with `using-superpowers`
- `Hard gate before implementation` aligned with `brainstorming`
- `Evidence before claims` aligned with `verification-before-completion`

Connect notes only if necessary. If connectors create clutter, rely on spatial alignment instead.

Expected: annotations support the diagram without competing with the main workflow.

- [ ] **Step 7: Enforce information boundaries from the spec**

Confirm that the SVG does **not** include any of the following:

- `spec review loop` back arrows
- `user review gate` backflow
- `dispatching-parallel-agents`
- implementer/spec-reviewer/code-quality-reviewer internals
- decision diamonds or branching questions

Expected: the diagram remains a clean overview, not a state machine.

- [ ] **Step 8: Validate typography and spacing manually**

Check that:

- body text is at least `22px`
- title is within the `28px` to `32px` range
- branch labels remain legible at article-column size
- arrowheads are visibly larger than the connector stroke
- there is enough whitespace between main nodes, branch nodes, and note boxes

Expected: the SVG remains readable on both desktop and mobile article widths.

- [ ] **Step 9: Verify self-contained SVG requirements before insertion**

Check that the SVG is fully self-contained:

- no external fonts
- no external CSS
- no scripts
- no remote images
- only generic `sans-serif` fallback in text styling
- all dimensions and margins defined inside the file
- arrowheads at least 2x the connector line width

Expected: the SVG renders independently with no external dependencies.

### Task 2: Insert the diagram into the Chinese article

**Files:**
- Modify: `public/blog/superpowers-workflow-analysis/index.zh.md`

- [ ] **Step 1: Locate the exact insertion point**

Find the first workflow `text` code block in the `## 概述` section.

Expected: insertion point is immediately after that block and before the paragraph beginning with `如果把 `superpowers` 只理解成一组可以随手调用的 skills`.

- [ ] **Step 2: Insert the localized Markdown image reference**

Insert exactly:

```md
![Superpowers 工作流主链](./assets/superpowers-workflow-chain.svg)
```

Leave one blank line before and after the image reference.

Expected: article structure stays the same except for the image insertion.

### Task 3: Insert the diagram into the English article

**Files:**
- Modify: `public/blog/superpowers-workflow-analysis/index.en.md`

- [ ] **Step 1: Locate the exact insertion point**

Find the first workflow `text` code block in the `## Overview` section.

Expected: insertion point is immediately after that block and before the paragraph beginning with `If `superpowers` is treated as a loose collection of callable skills`.

- [ ] **Step 2: Insert the localized Markdown image reference**

Insert exactly:

```md
![Superpowers workflow chain](./assets/superpowers-workflow-chain.svg)
```

Leave one blank line before and after the image reference.

Expected: English article structure stays aligned with the Chinese version.

### Task 4: Verify asset structure and repository compatibility

**Files:**
- Test: `public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg`
- Test: `public/blog/superpowers-workflow-analysis/index.zh.md`
- Test: `public/blog/superpowers-workflow-analysis/index.en.md`

- [ ] **Step 1: Verify article asset bundle structure**

Check that the article directory now contains:

- `index.zh.md`
- `index.en.md`
- `assets/superpowers-workflow-chain.svg`

Expected: asset lives inside the article-local `assets/` directory and no remote resources are referenced.

- [ ] **Step 2: Verify exact Markdown image paths**

Confirm that both article files reference the exact relative path `./assets/superpowers-workflow-chain.svg` and that the alt text remains localized.

Expected: one Chinese image line and one English image line, both pointing to the same local asset.

- [ ] **Step 3: Verify the SVG and article references in diff**

Run:

```bash
git diff -- public/blog/superpowers-workflow-analysis/index.zh.md public/blog/superpowers-workflow-analysis/index.en.md public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg
```

Expected: diff shows exactly one new SVG and two localized image insertions.

- [ ] **Step 4: Run repository verification commands**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands succeed after the SVG and Markdown updates.

- [ ] **Step 5: Optional commit step**

```bash
git add public/blog/superpowers-workflow-analysis/index.zh.md public/blog/superpowers-workflow-analysis/index.en.md public/blog/superpowers-workflow-analysis/assets/superpowers-workflow-chain.svg
git commit -m "Add superpowers workflow diagram"
```

Expected: run only if the user explicitly asks for a commit.
