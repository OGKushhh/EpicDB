import type { SavedQuery, QueryHistoryEntry } from "~/types/graphql";

const SAVED_KEY = "epicdb.graphql.savedQueries.v1";
const HISTORY_KEY = "epicdb.graphql.history.v1";
const MAX_HISTORY = 20;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[EpicDB] localStorage write failed:", err);
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ── Saved queries ────────────────────────────────────────────────────── */

export function loadSavedQueries(): SavedQuery[] {
  return readJSON<SavedQuery[]>(SAVED_KEY, []);
}

export function saveQuery(name: string, query: string, variables: string): SavedQuery {
  const list = loadSavedQueries();
  const sq: SavedQuery = {
    id: uid(),
    name,
    query,
    variables,
    createdAt: new Date().toISOString(),
  };
  list.unshift(sq);
  writeJSON(SAVED_KEY, list);
  return sq;
}

export function deleteSavedQuery(id: string) {
  const list = loadSavedQueries().filter((q) => q.id !== id);
  writeJSON(SAVED_KEY, list);
}

/* ── History ─────────────────────────────────────────────────────────── */

export function loadHistory(): QueryHistoryEntry[] {
  return readJSON<QueryHistoryEntry[]>(HISTORY_KEY, []);
}

export function addHistoryEntry(
  query: string,
  variables: string,
  ok: boolean
): QueryHistoryEntry {
  const list = loadHistory();
  const entry: QueryHistoryEntry = {
    id: uid(),
    query,
    variables,
    ranAt: new Date().toISOString(),
    ok,
  };
  list.unshift(entry);
  writeJSON(HISTORY_KEY, list.slice(0, MAX_HISTORY));
  return entry;
}

export function clearHistory() {
  writeJSON(HISTORY_KEY, []);
}
