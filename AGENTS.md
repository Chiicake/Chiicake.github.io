# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app.
- `src/pages/` holds route-level pages such as `Home.tsx`, `Blog.tsx`, `CliHome.tsx`, and `LocalBlogAdmin.tsx`.
- `src/components/` contains reusable UI, layout, animation, blog, home, and about components.
- `src/lib/` stores shared logic such as blog metadata helpers, game logic, prefetch helpers, and local admin state.
- `src/i18n/locales/` contains `zh.json` and `en.json`; keep keys aligned.
- `public/blog/` stores blog content and assets by slug, plus `public/blog/index.json`.
- `scripts/` contains local tooling, including the Python blog publisher.
- `tests/` contains JavaScript `node:test` files and Python unit tests.

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server.
- `npm run build` runs TypeScript build checks and outputs production assets to `dist/`.
- `npm run lint` runs ESLint across the repo.
- `node --test tests/gameOfLife.test.mjs` runs the Game of Life tests.
- `node --test tests/snake.test.mjs` runs the Snake logic tests.
- `python3 -m unittest tests.test_publish_blog` runs the Python blog publisher tests.

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation and semicolons, matching the existing codebase.
- Prefer functional React components and hooks.
- Use `PascalCase` for components, `camelCase` for functions/variables, and `kebab-case` for blog slugs.
- Keep UI text in `src/i18n/locales/*.json`; avoid hardcoding copy in components unless it is purely structural.
- Run `npm run lint` before submitting changes.

## Testing Guidelines
- There is no single `npm test` script; run the relevant targeted tests for touched areas.
- Add or update tests when changing logic-heavy code in `src/lib/`, `scripts/`, or interactive widgets.
- Keep test names descriptive, for example `gameOfLife.test.mjs` or `test_publish_blog.py`.

## Commit & Pull Request Guidelines
- Follow the existing commit style: short, imperative summaries such as `Normalize CLI command display` or `Add content type and source metadata for blog articles`.
- Keep commits scoped to one logical change.
- PRs should include:
  - a concise summary,
  - screenshots or recordings for UI changes,
  - affected routes or files,
  - any manual verification steps.

## Repost Blog Workflow
- When asked to repost a blog, assume the user will provide only a source URL.
- Fetch the source article from that URL, preserve its structure, and keep headings, code blocks, lists, quotes, images, and links aligned with the original format.
- Publish reposted articles with the existing repost model: set `contentType` to `repost` and store the original URL in `source.url`.
- Do not invent a new repost schema or a fixed extra tag; use the repository’s current repost fields.
- Check `public/blog/index.json` before publishing. Reuse existing tags, categories, and collections when they fit; create new ones only when nothing suitable exists.
- If the source article includes a summary, adapt it for the post metadata. If it does not, generate a simple Chinese summary of about 20 characters.
- For English-source articles, write the Chinese translation to `index.zh.md` and keep the original English text in `index.en.md`.
- Keep article assets under `public/blog/<slug>/assets/` and keep code fences, titles, and section ordering stable across both language files.
- Do not leave reposted images as remote hotlinks. Download source images into the article’s own `assets/` directory and rewrite Markdown references to local relative paths.
- Complete the post through the existing local workflow so that the article, metadata, and repost source link all remain compatible with the current blog system.

## Assisted Original Submission Workflow
- When asked to assist with an original post, assume the user will provide a local Markdown file.
- Treat this flow as an original publication. Use `contentType: original`; do not set repost metadata or `source.url`.
- Read the Markdown, preserve its structure, and keep headings, code blocks, lists, quotes, images, and links aligned with the source file.
- Generate the missing i18n counterpart for the post. If the input Markdown is Chinese, write the English version to `index.en.md`; if the input Markdown is English, write the Chinese version to `index.zh.md`.
- Publish the post under a suitable `public/blog/<slug>/` directory and keep both language files in that folder.
- Extract local image dependencies into `public/blog/<slug>/assets/` and rewrite Markdown references to local relative asset paths.
- Check `public/blog/index.json` before publishing. Reuse existing tags, categories, and collections when they fit; create new ones only when nothing suitable exists.
- Complete the post through the existing local workflow so that the article, metadata, assets, and language files remain compatible with the current blog system.

## Original Technical Blog Writing Style
- Use direct, factual language. Avoid marketing phrases like "elegant solution", "powerful tool", "modern approach", etc.
- Do not use emoji in technical content.
- Do not use star ratings or other scoring systems to compare technologies.
- Prefer neutral, academic tone over enthusiastic or promotional language.
- Use precise technical terminology without unnecessary embellishment.
- Structure comparisons as factual tables or lists, not subjective evaluations.
- Title format: "Topic: Subtitle" or "Topic Analysis" rather than "Topic: Marketing Phrase".
- Examples:
  - Avoid: "ChaCha20-Poly1305: The Elegant Choice for Modern Encryption ✨"
  - Use: "ChaCha20-Poly1305 AEAD Algorithm Analysis"
- Avoid: "★★★★★ Excellent software performance"
- Use: "High software performance" or provide specific benchmark data
- Avoid: "This powerful algorithm elegantly combines..."
- Use: "This algorithm combines..."

## Personal Writing Voice For Original Posts
- When drafting original Chinese technical posts, prefer a modest first-person voice instead of an impersonal tutorial voice.
- The tone should feel serious, restrained, and practical; avoid motivational language, exaggerated confidence, or teacher-like authority.
- It is acceptable to mention personal background briefly, but only in grounded ways such as ongoing learning, past work habits, or why a topic is being revisited.
- Prefer wording like "想做一个专栏", "算是把这条线重新捡起来", "看看能不能对读者产生一点启发", "希望能认真对待这个系列".
- When explaining goals, keep them modest and concrete. Do not promise mastery or expert outcomes; prefer phrasing like "带到一般人" or "能够独立阅读文档、理解常见组件、写出基础服务的阶段".
- Light self-deprecation is acceptable when it lowers the posture and keeps the text honest, but avoid turning it into jokes, slang, or performative humor.
- Avoid AI-sounding openings such as abstract definitions, broad industry statements, or overly polished transitions. Start from the writer's real context, motivation, or the concrete problem being discussed.
- Sentence rhythm can be slightly conversational, but keep vocabulary professional. Use plain expressions over ornate phrasing.
- For series introductions or prefaces, a good default structure is: current learning/practice state -> why this topic or series is being written -> why the title is chosen -> a modest statement of scope and expected reader outcome.
- When editing user-provided prose, preserve their original intent and personality. Prefer light polishing over rewriting into a generic "better" style.

## Visual Assets for Technical Blog Posts
- SVG diagrams should use light backgrounds (#ffffff or #fafafa) to ensure visibility in both light and dark themes.
- Use neutral, muted colors (grays, blacks) for text and lines.
- Avoid bright, saturated colors that may clash with site themes.
- Ensure sufficient contrast for readability.
- Keep diagram styling minimal and professional.

## Security & Local Admin Notes
- `/#/local-blog-admin-studio-chiicake-2026` is intended for local use only; keep that restriction intact.
- Do not commit secrets, machine-specific paths, or generated cache directories such as `__pycache__/`.
