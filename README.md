---
title: EpicDB
sdk: static
app_file: index.html
pinned: false
---

# 📜 EpicDB 📜

Browse the Epic-Unlocker manifest archive and the full Epic Games Store catalog in one place.
### https://epicdb.netlify.app/

## Quick start

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev             # http://localhost:5173
```

Requires Node.js v22+.

## Deploy

A GitHub Actions workflow (`.github/workflows/hf_sync.yml`) builds on every
push to `main` and force-pushes `dist/` to the Hugging Face Space repo. HF then
serves the static files as-is — no build step on HF.

Because the force-push replaces the entire Space repo, the workflow also
copies `README.md` (with the YAML front-matter HF needs to configure
`sdk` / `app_file` / `pinned`) into `dist/` before pushing — so it
survives redeployments.

The workflow's Build step maps the unprefixed secret names to the `VITE_`
prefix Vite expects (see the `env:` block in `hf_sync.yml`). HF Variables are
not used — Vite reads env vars only at build time, and the build runs in
GitHub Actions, not on HF.

## Notes

- The Manifest page uses `effective_id` from `/titles` for both display and the `/info` + `/download` URL paths.
- `/download` and `/upload/manual` are public (no API key needed). All other manifest endpoints require `X-API-Key`.
- Search on the Manifest page is client-side (the backend has no `/search` endpoint).
