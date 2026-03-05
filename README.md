# Chiicake.github.io

## GitHub Pages deployment

This repository must be published via **GitHub Actions** (workflow: `.github/workflows/deploy.yml`).

- Expected Pages source: `GitHub Actions`
- Do not use `Deploy from a branch` for this Vite app

If Pages is set to branch mode, GitHub serves the repository root `index.html`, which imports `/src/main.tsx` and causes browser MIME errors in production.
