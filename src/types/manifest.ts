/**
 * Type definitions for the Manifest backend API.
 * Backend source: app.py — `Manifest Database Endpoints – Epic-Unlocker uploads`.
 *
 * The `/api/manifest/titles` endpoint returns `entries[].effective_id`, which is
 * the canonical lookup key the entry is stored under in the backend's index.
 * Use `effective_id` for both display and for building `/info` and `/download`
 * URLs. Never use `entry.build_id` directly — it may be "" or "unknown" for
 * old binary manifests (DataVersion 0); in that case the UI should render
 * `effective_id` with a "SHA1 fallback" hint.
 */

/** A single manifest entry inside the `/titles` response. */
export interface ManifestTitleEntry {
  /** Canonical lookup key — use this for display and /info + /download URLs. */
  effective_id: string;
  /** Original info.build_id from the manifest. May be "" or "unknown" for old binary manifests. */
  build_id: string;
  /** SHA1 hex for old binary manifests (== effective_id in that case); == build_id for modern manifests. */
  fallback_build_id: string;
  /** "binary" (Epic .manifest) or "json" (Epic .item). */
  file_type: "binary" | "json";
  /** BuildVersion from the manifest. */
  build_version: string;
  /** ISO-8601 UTC upload timestamp. */
  uploaded_at: string;
  /** Relative storage path under /data/manifests/. */
  storage_path: string;
}

/** A grouped game in the `/titles` response. */
export interface ManifestTitleGroup {
  display_name: string;
  app_name: string;
  build_versions: string[];
  entries: ManifestTitleEntry[];
  entry_count: number;
}

/** Full shape of GET /api/manifest/titles. */
export interface TitlesResponse {
  total_games: number;
  games: ManifestTitleGroup[];
}

/** Full shape of GET /api/manifest/stats. */
export interface StatsResponse {
  total_manifests: number;
  total_apps: number;
  storage_path: string;
  apps: Record<string, number>;
  last_updated: string | null;
}

/** GET /api/manifest/list returns a tree: app_name → [filename.manifest, ...]. */
export type ListResponse = Record<string, string[]>;

/**
 * GET /api/manifest/info/<app_name>/<effective_id> returns the full index entry.
 * This shape mirrors the entry stored in the backend's index.json.
 */
export interface ManifestInfoEntry {
  app_name: string;
  build_id: string;
  fallback_build_id: string;
  file_type: "binary" | "json";
  build_version: string;
  app_id: number;
  app_version_string: string | null;
  custom_fields: Record<string, string>;
  uploaded_at: string;
  original_filename: string;
  sha256: string;
  file_size: number;
  storage_path: string;
  header_sha_hash: string;
  data_version: number;
  feature_level: number;
}

/** Standard error payload returned by the backend on 4xx/5xx. */
export interface ManifestApiError {
  error: string;
  details?: Record<string, unknown>;
}

/**
 * Heuristic: detect whether an entry's effective_id is a SHA1 fallback
 * (i.e. the original build_id was empty/"unknown" — old binary manifest with
 * DataVersion 0). The backend's fallback is 40-char SHA1 hex; modern
 * InstallationGuid is 22 chars; BuildVersion is a free-form string.
 *
 * Use this to decide whether to render the "SHA1 fallback — old binary manifest"
 * badge in the UI.
 */
export function isSha1Fallback(entry: {
  build_id: string;
  fallback_build_id: string;
}): boolean {
  const { build_id, fallback_build_id } = entry;
  if (!build_id || build_id === "unknown") return true;
  // If build_id differs from fallback_build_id, fallback was used.
  return Boolean(fallback_build_id) && build_id !== fallback_build_id;
}
