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

## Security & Local Admin Notes
- `/#/local-blog-admin-studio-chiicake-2026` is intended for local use only; keep that restriction intact.
- Do not commit secrets, machine-specific paths, or generated cache directories such as `__pycache__/`.
