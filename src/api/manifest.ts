/**
 * Manifest API client — talks to the Epic-Unlocker backend (Flask on Hugging
 * Face Space). All endpoints require the `X-API-Key` header EXCEPT
 * `/download`, which is public. The key is read from
 * `import.meta.env.VITE_MANIFEST_API_KEY`; the base URL from
 * `VITE_MANIFEST_API_BASE` (defaults to the production HF Space URL).
 *
 * Endpoint reference (backend: app.py manifest section):
 *   GET  /titles                              → list of all games + entries
 *   GET  /stats                               → DB statistics
 *   GET  /list                                → tree of apps → .manifest files
 *   GET  /info/<app_name>/<effective_id>      → full metadata for a manifest
 *   GET  /download/<app_name>/<effective_id> → raw manifest file (PUBLIC, no key)
 *   POST /cleanup?dry_run=true|false          → remove stale "unknown" entries >24h
 *   POST /rebuild                             → rebuild index.json from filesystem
 *
 * `effective_id` (returned in each /titles entry) is the canonical lookup key.
 * Use it for both display and the path segments in /info and /download URLs.
 */

import type {
  ListResponse,
  ManifestApiError,
  ManifestInfoEntry,
  StatsResponse,
  TitlesResponse,
} from "~/types/manifest";

/** Base URL of the manifest API, no trailing slash. */
const API_BASE = (import.meta.env.VITE_MANIFEST_API_BASE ?? "").replace(/\/+$/, "");

/** API key sent as the X-API-Key header on protected endpoints. */
const API_KEY = import.meta.env.VITE_MANIFEST_API_KEY ?? "";

if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.warn(
    "[EpicDB] VITE_MANIFEST_API_BASE is not set — manifest API calls will fail.",
    "Set it in .env (see .env.example)."
  );
}

export const MANIFEST_CONFIG = {
  base: API_BASE,
  key: API_KEY,
} as const;

/** A structured error thrown by the manifest API client. */
export class ManifestClientError extends Error {
  status: number;
  payload?: ManifestApiError;

  constructor(status: number, message: string, payload?: ManifestApiError) {
    super(message);
    this.name = "ManifestClientError";
    this.status = status;
    this.payload = payload;
  }
}

/** Build the absolute URL for a manifest endpoint path. */
function urlFor(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${clean}`;
}

/** Build the download URL for a manifest — public, no key needed. */
export function buildDownloadUrl(appName: string, effectiveId: string): string {
  return urlFor(
    `/download/${encodeURIComponent(appName)}/${encodeURIComponent(effectiveId)}`
  );
}

/** Build the info URL for a manifest. */
export function buildInfoUrl(appName: string, effectiveId: string): string {
  return urlFor(
    `/info/${encodeURIComponent(appName)}/${encodeURIComponent(effectiveId)}`
  );
}

/** Core fetch wrapper. Adds X-API-Key, normalises errors. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (API_KEY) headers.set("X-API-Key", API_KEY);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(urlFor(path), { ...init, headers });
  } catch (err) {
    throw new ManifestClientError(
      0,
      `Network error reaching manifest API: ${(err as Error).message}`
    );
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    const errPayload = (payload ?? { error: res.statusText }) as ManifestApiError;
    throw new ManifestClientError(
      res.status,
      errPayload.error ?? `HTTP ${res.status}`,
      errPayload
    );
  }

  return payload as T;
}

/** GET /titles — list all games with their manifest entries. */
export function fetchTitles(): Promise<TitlesResponse> {
  return request<TitlesResponse>("/titles");
}

/** GET /stats — manifest DB statistics. */
export function fetchStats(): Promise<StatsResponse> {
  return request<StatsResponse>("/stats");
}

/** GET /list — tree of app_name → .manifest filenames. */
export function fetchList(): Promise<ListResponse> {
  return request<ListResponse>("/list");
}

/** GET /info/<app_name>/<effective_id> — full metadata for one manifest. */
export function fetchInfo(
  appName: string,
  effectiveId: string
): Promise<ManifestInfoEntry> {
  return request<ManifestInfoEntry>(
    `/info/${encodeURIComponent(appName)}/${encodeURIComponent(effectiveId)}`
  );
}

/** POST /cleanup?dry_run=true|false — remove stale "unknown" entries older than 24h. */
export function cleanupManifests(dryRun = true): Promise<{
  status: string;
  dry_run: boolean;
  removed_count: number;
  removed: Array<{ build_id: string; storage_path: string; age_hours: number; reason: string }>;
  kept_count: number;
  kept: Array<{ build_id: string; age_hours: number; reason: string }>;
}> {
  return request(`/cleanup?dry_run=${dryRun ? "true" : "false"}`, {
    method: "POST",
  });
}

/** POST /rebuild — rebuild index.json by scanning the filesystem. */
export function rebuildIndex(): Promise<{
  status: string;
  scanned: number;
  index_entries: number;
  errors: string[];
}> {
  return request("/rebuild", { method: "POST" });
}
