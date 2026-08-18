---
title: EpicDB
sdk: static
app_file: index.html
pinned: false
---

# 📜 EpicDB

A Vite + React + TypeScript single-page app that bundles two browsers in one site:

1. **Manifest Browser** — lists every manifest stored in the
   [Epic-Unlocker manifest database](https://github.com/acidicoala/ScreamDB)
   (Flask API on Hugging Face), with search, stats, and one-click downloads.
2. **GraphQL Browser** — runs ad-hoc GraphQL queries against the official
   Epic Games catalog endpoint, with saved queries, recent history,
   variables, collapsible JSON results, and copy-to-clipboard.

EpicDB is the successor to ScreamDB — rebuilt from scratch on Vite
(no more Create React App), with Tailwind CSS for styling and a cleaner
two-page architecture.

## 🚀 Quick start

```bash
git clone <repo>
cd EpicDB
pnpm install        # or npm install
cp .env.example .env   # fill in real values
pnpm dev            # or npm run dev
```

Open <http://localhost:5173>. Vite hot-reloads on save.

### Requirements

- Node.js v22+
- pnpm v10 (or npm v10+)

## 🔐 Environment variables

All client-exposed variables use the `VITE_` prefix (Vite's convention; the
previous CRA-style `REACT_APP_` prefix is no longer used). Define them in
`.env` (or `.env.local` for personal overrides — git-ignored).

| Variable | Purpose | Example |
|---|---|---|
| `VITE_MANIFEST_API_KEY` | `X-API-Key` header sent on every protected manifest API call. The `/download` endpoint is public and does NOT require this key. | `sc_abc123` |
| `VITE_MANIFEST_API_BASE` | Base URL of the manifest backend. No trailing slash. | `https://ogkushhh-abdobest.hf.space/api/manifest` |
| `VITE_EPIC_GRAPHQL_ENDPOINT` | URL of the Epic Games GraphQL proxy (Cloudflare Worker). Browsers cannot hit `graphql.epicgames.com` directly because of CORS + a User-Agent whitelist, so a proxy is mandatory. | `https://epic-cors-proxy.acidicoala.workers.dev` |

See [`.env.example`](./.env.example) for a ready-to-copy template.

## 🧱 Architecture

```
EpicDB/
├── src/
│   ├── api/
│   │   ├── manifest.ts    # fetch-based client for the Flask backend, with X-API-Key
│   │   └── graphql.ts    # fetch-based client for Epic's GraphQL proxy
│   ├── components/
│   │   ├── Manifest/      # GameList, GameSearch, GameStats, DownloadButton, GameDetail
│   │   ├── GraphQL/       # QueryEditor (Monaco), QueryHistory, SavedQueries, ResultsDisplay
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── JsonViewer.tsx
│   │   └── Loading.tsx
│   ├── hooks/
│   │   ├── useManifests.ts # TanStack Query hooks wrapping the manifest client
│   │   └── useGraphQL.ts   # mutation hook for GraphQL runs
│   ├── pages/
│   │   ├── ManifestPage.tsx
│   │   └── GraphQLPage.tsx
│   ├── types/
│   │   ├── manifest.ts     # TitlesResponse, StatsResponse, ManifestInfoEntry, ...
│   │   └── graphql.ts
│   ├── App.tsx             # router + layout
│   ├── main.tsx            # entry point
│   ├── index.css           # Tailwind v4 + theme tokens
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

### Tech stack

- **Vite 7** with `@vitejs/plugin-react` + `@tailwindcss/vite`
- **React 19** (functional components + hooks only)
- **TypeScript 5** (strict mode)
- **Tailwind CSS v4** (CSS-based theme via `@theme` directive)
- **React Router v7** (data router)
- **TanStack Query v5** (data fetching + caching)
- **Monaco Editor** (GraphQL query editing with syntax highlighting)
- **@fontsource-variable/outfit** + **@fontsource-variable/fira-code** (typography)

No Create-React-App, no `react-scripts`, no `REACT_APP_*` env vars. The
build outputs static files to `dist/` and the app is a pure SPA — no
server runtime required.

## 🧩 The `effective_id` rule (Manifest Browser)

The `/api/manifest/titles` endpoint returns each entry with three ID fields:

| Field | Meaning |
|---|---|
| `effective_id` | **Canonical lookup key. Use this for display AND for `/info` + `/download` URLs.** |
| `build_id` | The original `info.build_id` from the manifest. May be `""` or `"unknown"` for old binary manifests (DataVersion 0). |
| `fallback_build_id` | SHA1 hex (`header_sha_hash_hex`) for old binary manifests; equals `build_id` for modern manifests. |

When `build_id` is empty or `"unknown"`, the entry is keyed by
`fallback_build_id` (the SHA1 hex). The backend exposes this as
`effective_id`, so the UI never has to recompute the fallback rule —
just always use `effective_id`.

The UI also renders a `fallback` badge and a dimmed/italic style when
`isSha1Fallback(entry)` returns true, so users can spot old binary
manifests at a glance.

## 🌐 API endpoints used

### Manifest backend (`VITE_MANIFEST_API_BASE`)

| Method & path | Purpose | Auth |
|---|---|---|
| `GET /titles` | List all games + their manifest entries | `X-API-Key` |
| `GET /stats` | Total manifests, apps, last update | `X-API-Key` |
| `GET /list` | Tree of app_name → `.manifest` filenames | `X-API-Key` |
| `GET /info/<app_name>/<effective_id>` | Full metadata for one manifest | `X-API-Key` |
| `GET /download/<app_name>/<effective_id>` | Raw manifest file | **public** (no key) |
| `POST /cleanup?dry_run=true\|false` | Remove stale "unknown" entries > 24h | `X-API-Key` |
| `POST /rebuild` | Rebuild `index.json` from filesystem | `X-API-Key` |

**Client-side search:** the backend has no `/search` endpoint, so search
in the Manifest Browser is implemented client-side by filtering the
`/titles` response.

### Epic GraphQL (`VITE_EPIC_GRAPHQL_ENDPOINT`)

- Single `POST` endpoint accepting a GraphQL envelope `{ query, variables, operationName }`.
- Responds with the standard `{ data, errors }` shape.
- The CORS proxy injects the correct `User-Agent` and returns
  `Access-Control-Allow-Origin: *` so the browser can call it.

## ☁️ Deploy to Hugging Face Static Space

This repo is structured as a Hugging Face **Static Space**. The YAML
front-matter at the top of this README tells the Space how to build:

```yaml
---
title: EpicDB
sdk: static
app_build_command: npm install && npm run build
app_file: dist/index.html
pinned: false
---
```

To deploy:

1. Create a new Space at <https://huggingface.co/new-space> with
   **SDK = static**.
2. Push this repo to the Space's git remote.
3. Set the Space secrets `VITE_MANIFEST_API_KEY`,
   `VITE_MANIFEST_API_BASE`, and `VITE_EPIC_GRAPHQL_ENDPOINT` in the
   Space's **Settings → Variables and secrets** panel. (Hugging Face
   will pass them as build-time env vars, so Vite can inline them into
   the bundle.)
4. Wait for the auto-build to finish. The app will be live at
   `https://<user>-<space-name>.hf.space`.

## 📜 Available scripts

| Command | Action |
|---|---|
| `pnpm dev` | Start the Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) then bundle to `dist/` |
| `pnpm preview` | Serve the built bundle locally for preview |
| `pnpm lint` | Run ESLint across the repo |
| `pnpm format` | Prettier check |
| `pnpm format:fix` | Prettier write |
