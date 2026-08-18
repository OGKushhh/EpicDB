---
title: EpicDB
sdk: static
app_file: index.html
pinned: false
---

# EpicDB

Browse the Epic-Unlocker manifest archive and the full Epic Games Store catalog in one place.

## Pages

| Page | What it does |
|---|---|
| **Home** (`/`) | Intro + links to the two browsers. |
| **Manifest** (`/manifests`) | Search + paginate the uploaded manifest archive. Click any entry for full metadata + download. |
| **Browse** (`/browse`) | Grid of every game on the Epic Games Store (live from Epic's GraphQL). Sort, search, click a card for Item ID + store links. |

## Quick start

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev             # http://localhost:5173
```

Requires Node.js v22+.

## Environment variables

Set in `.env` locally (see `.env.example`). Vite only reads `.env` at startup —
restart `npm run dev` after editing.

| Variable | Purpose |
|---|---|
| `VITE_MANIFEST_API_KEY` | `X-API-Key` for the manifest API |
| `VITE_MANIFEST_API_BASE` | Manifest backend URL (e.g. `https://ogkushhh-abdobest.hf.space/api/manifest`) |
| `VITE_EPIC_GRAPHQL_ENDPOINT` | Epic GraphQL CORS proxy URL |

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the built app |

## Deploy

A GitHub Actions workflow (`.github/workflows/hf_sync.yml`) builds on every
push to `main` and force-pushes `dist/` to the Hugging Face Space repo. HF then
serves the static files as-is — no build step on HF.

Because the force-push replaces the entire Space repo, the workflow also
copies `README.md` (with the YAML front-matter HF needs to configure
`sdk` / `app_file` / `pinned`) into `dist/` before pushing — so it
survives redeployments.

### Required GitHub Secrets

Set these in the **source** GitHub repo → Settings → Secrets and variables →
Actions → New repository secret:

| Secret name | Purpose |
|---|---|
| `MANIFEST_API_KEY` | `X-API-Key` for the manifest API |
| `MANIFEST_API_BASE` | Manifest backend URL |
| `EPIC_GRAPHQL_ENDPOINT` | Epic GraphQL CORS proxy URL |
| `HF_TOKEN` | Hugging Face write token (for `git push` to the Space) |

The workflow's Build step maps the unprefixed secret names to the `VITE_`
prefix Vite expects (see the `env:` block in `hf_sync.yml`). HF Variables are
not used — Vite reads env vars only at build time, and the build runs in
GitHub Actions, not on HF.

⚠️ Because this is a static SPA, the API key ends up baked into the deployed
JS — anyone reading the HF Space repo can extract it. There is no way to hide
a secret in client-side code; if that matters, deploy a small backend proxy
that injects `X-API-Key` server-side.

## Notes

- The Manifest page uses `effective_id` from `/titles` for both display and the `/info` + `/download` URL paths — never the raw `build_id`.
- `/download` is public (no API key needed). All other manifest endpoints require `X-API-Key`.
- Search on the Manifest page is client-side (the backend has no `/search` endpoint).

## License

Public domain — no rights reserved.
