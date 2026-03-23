# zh-reduce-ai Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and globally install a reusable OpenCode skill named `zh-reduce-ai` for constrained Chinese technical rewriting, with a canonical install path and optional compatibility symlink.

**Architecture:** The implementation has four outputs: a canonical `SKILL.md` under the OpenCode global skills directory, an optional compatibility symlink under `~/.agents/skills/`, a repo-local design/plan trail, and basic discovery verification against OpenCode naming and path rules. The skill content should be narrow enough for reliable discovery and strict enough to preserve terminology, logic, and near-original length.

**Tech Stack:** Markdown skill definition, OpenCode global skill discovery paths, local filesystem paths under `~/.config/opencode/skills/` and optional symlink compatibility under `~/.agents/skills/`

---

## File Structure

- Create: `/home/pkw/.config/opencode/skills/zh-reduce-ai/SKILL.md`
  - Canonical OpenCode global skill definition
- Optional symlink: `/home/pkw/.agents/skills/zh-reduce-ai`
  - Compatibility path pointing to the canonical OpenCode skill directory
- Reference: `/home/pkw/code/Chiicake.github.io/docs/superpowers/specs/2026-03-23-zh-tech-rewrite-skill-design.md`
  - Approved spec that defines scope, constraints, wording, and install strategy
- Reference: `/home/pkw/.opencode/skills/chiicake-skills/skills/article-writing/SKILL.md`
  - Existing OpenCode-compatible skill example for structure and tone

### Task 1: Create the canonical global skill

**Files:**
- Create: `/home/pkw/.config/opencode/skills/zh-reduce-ai/SKILL.md`

- [ ] **Step 1: Verify the parent global skill directory state**

Confirm whether `/home/pkw/.config/opencode/skills/` already exists.

Expected: if missing, create it before writing the skill; if present, reuse it without restructuring unrelated skills.

- [ ] **Step 2: Create the skill directory**

Create `/home/pkw/.config/opencode/skills/zh-reduce-ai/`.

Expected: directory name exactly matches the skill name `zh-reduce-ai`.

- [ ] **Step 3: Write exact frontmatter with canonical discovery fields**

Write this exact frontmatter at the top of `SKILL.md`:

```yaml
---
name: zh-reduce-ai
description: Use when revising existing Chinese technical prose that must keep original terminology, logic, and near-original length.
---
```

Expected: name matches the directory name and follows OpenCode naming rules.

- [ ] **Step 4: Write the overview and usage boundaries**

Add sections that directly state:

- `Overview`
- `When to Use`
- `When NOT to use`

Use those section headings directly rather than paraphrasing them.

Then ensure they state:

- this is a constrained rewrite skill, not a freeform writing skill
- it is for existing Chinese technical prose
- it is for reducing templated AI tone without changing facts
- it is not for greenfield writing, marketing copy, or non-technical creative polishing

Expected: the top of the skill already communicates narrow scope before the detailed rules begin.

- [ ] **Step 5: Write the hard constraints section**

Include hard rules covering at least:

- preserve terminology, code, identifiers, paths, config keys, and API paths exactly
- preserve logic, causality, conditions, and factual meaning
- no first person
- no `xxx呢`
- output must be equal length or shorter by default; only negligible punctuation-level variance is allowed if exact parity is impossible
- do not fill space with vague, ceremonial, or generic prose

Expected: the constraint layer is stricter than the stylistic layer.

- [ ] **Step 6: Write the rewrite moves section**

Convert the user's original prompt into controlled rewrite moves rather than a mechanical substitution engine. Include:

- light verb-phrase expansion
- limited helper-word additions
- context-sensitive synonym substitutions
- bracket integration rules
- gentle sentence-structure relaxation without chatty tone

Expected: the section teaches style moves without encouraging blind replacement.

- [ ] **Step 7: Write the forbidden patterns and length control sections**

Include two explicit forbidden groups:

- high-risk AI templates
- low-quality colloquial patterns

Then add a dedicated length-control section with a concrete rewrite order:

1. remove empty filler
2. prefer local rewrites
3. expand only if length remains controlled
4. compress elsewhere if any sentence grows

Expected: anti-AI-tone behavior is balanced by explicit brevity control.

- [ ] **Step 8: Add bracket handling, quality checks, and mini examples**

Add:

- bracket and identifier handling guidance
- a short final checklist before delivery
- a few compact before/after examples showing safe transformations

Expected: the skill is practical and reusable without becoming too long or too rigid.

### Task 2: Add compatibility path if appropriate

**Files:**
- Optional symlink: `/home/pkw/.agents/skills/zh-reduce-ai`

- [ ] **Step 1: Verify the compatibility parent directory exists**

Confirm `/home/pkw/.agents/skills/` exists.

Expected: if it exists, it may host the compatibility symlink; if it does not, skip compatibility setup rather than creating a parallel second installation tree without need.

- [ ] **Step 2: Create a symlink instead of a second copy**

Default rule: create the compatibility symlink only if `/home/pkw/.agents/skills/` exists, because this environment already uses that path as a compatible discovery location. Otherwise skip compatibility setup.

If the parent exists and there is no conflicting path, create:

```bash
ln -s /home/pkw/.config/opencode/skills/zh-reduce-ai /home/pkw/.agents/skills/zh-reduce-ai
```

Expected: one source of truth, no duplicate `SKILL.md` copies.

- [ ] **Step 3: Inspect the target compatibility path before linking**

Inspect `/home/pkw/.agents/skills/zh-reduce-ai` and classify it as one of:

- absent
- already the correct symlink
- conflicting symlink target
- real directory/file path with content

Expected: the worker reports the exact case instead of guessing.

- [ ] **Step 4: Skip compatibility path if it would introduce ambiguity**

If a conflicting path already exists or symlink creation would be unsafe, do not create a second content copy.

Expected: canonical installation remains `/home/pkw/.config/opencode/skills/zh-reduce-ai/SKILL.md`.

### Task 3: Verify OpenCode compatibility and discovery readiness

**Files:**
- Test: `/home/pkw/.config/opencode/skills/zh-reduce-ai/SKILL.md`

- [ ] **Step 1: Verify exact path and file naming**

Check that:

- the directory is exactly `zh-reduce-ai`
- the file is exactly `SKILL.md`
- the frontmatter `name` matches the directory name

Expected: path and naming satisfy OpenCode discovery rules.

- [ ] **Step 2: Verify frontmatter shape**

Confirm the top of the file includes only the intended fields for this skill implementation:

- `name`
- `description`

Expected: no malformed frontmatter and no invalid name formatting.

- [ ] **Step 3: Verify scope remains narrow**

Re-read the final `SKILL.md` and confirm it clearly says:

- use on existing Chinese technical prose
- not for writing from scratch
- not for marketing or non-technical freeform writing

Expected: the skill cannot be reasonably mistaken for a generic writing helper.

- [ ] **Step 4: Verify canonical section headings exist**

Confirm the final `SKILL.md` contains these distinct sections as written:

- `Overview`
- `When to Use`
- `When NOT to use`
- `Hard Constraints`

Expected: the implemented file matches the spec's minimum skeleton instead of an improvised structure.

- [ ] **Step 5: Verify hard constraints are implementation-safe**

Confirm the final text explicitly states:

- technical tokens are preserved exactly
- logic and factual meaning cannot change
- first person is forbidden
- `xxx呢` is forbidden
- equal-or-shorter length target with only negligible punctuation-level variance allowed

Expected: the rewrite contract is concrete enough to guide model behavior.

- [ ] **Step 6: Verify discovery readiness from the actual install paths**

Confirm at minimum:

- the canonical file exists at `/home/pkw/.config/opencode/skills/zh-reduce-ai/SKILL.md`
- if the compatibility symlink was created, it resolves to the canonical directory
- the final install state matches one of the allowed outcomes from the spec

If this environment exposes a local skill-listing or discovery mechanism, run it and confirm `zh-reduce-ai` appears through the active discovery path.

Expected: verification covers actual discovery readiness, not only static file inspection.

- [ ] **Step 7: Verify canonical install plus compatibility outcome**

Check the final install state and report one of these outcomes:

- canonical OpenCode skill installed, no compatibility symlink needed
- canonical OpenCode skill installed, compatibility symlink created successfully

Expected: final state is unambiguous and has only one content source.

- [ ] **Step 8: Optional commit step**

```bash
git add docs/superpowers/specs/2026-03-23-zh-tech-rewrite-skill-design.md docs/superpowers/plans/2026-03-23-zh-tech-rewrite-skill.md
git commit -m "Plan zh-reduce-ai global skill"
```

Expected: run only if the user explicitly asks for a commit.
