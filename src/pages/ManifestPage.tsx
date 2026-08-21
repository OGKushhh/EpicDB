import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTitles } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { ErrorBlock, GameGridSkeleton, EmptyState } from "~/components/Loading";
import { GameSearch, useFilteredGames } from "~/components/Manifest/GameSearch";
import { GameStats } from "~/components/Manifest/GameStats";
import { ManifestCardGrid } from "~/components/Manifest/ManifestCardGrid";
import { Pagination } from "~/components/Pagination";
import {
  ManifestFilters,
  SORT_BY,
  SORT_DIR,
  FILE_TYPE_FILTER,
  COUNTERPART_FILTER,
  type ManifestFiltersState,
} from "~/components/Manifest/ManifestFilters";
import { findRelated } from "~/types/manifest";
import { UploadModal } from "~/components/Manifest/UploadModal";

/** Build the API base URL from env (same logic as api/manifest.ts). */
const API_BASE = (import.meta.env.VITE_MANIFEST_API_BASE ?? "").replace(/\/+$/, "");

/** Default entries per page in the manifest grid. */
const DEFAULT_PAGE_SIZE = 24;

/** A flattened entry paired with its parent group for easy pagination. */
interface FlatEntry {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
}

/**
 * Manifest Browser page — lists all games from the /titles endpoint as a card
 * grid (display_name as title, color-coded by file_type, per-card download +
 * Details buttons). Search/filter/sort client-side; paginated. Clicking
 * "Details" opens a slide-over panel with full metadata from /info.
 *
 * Uses `effective_id` from each entry for both display and the /info +
 * /download URLs (never the raw `build_id`).
 */
export function ManifestPage() {
  const { data, isLoading, error, refetch } = useTitles();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ManifestFiltersState>({
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: SORT_BY.UPLOADED_AT,
    sortDir: SORT_DIR.DESC,
    fileType: FILE_TYPE_FILTER.ALL,
    counterpart: COUNTERPART_FILTER.ALL,
  });
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dlAllState, setDlAllState] = useState<"idle" | "loading" | "error">("idle");
  const [dlProgress, setDlProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const handleDownloadAll = useCallback(async () => {
    if (!API_BASE) {
      setDlAllState("error");
      return;
    }
    const prev = abortRef.current;
    prev?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setDlAllState("loading");
    setDlProgress(0);

    try {
      const res = await fetch(`${API_BASE}/api/manifest/download-all`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentLength = res.headers.get("content-length");
      const total = contentLength ? Number(contentLength) : 0;

      if (!res.body) {
        // Fallback: no streaming support, just blob download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "manifests.zip"; a.click();
        URL.revokeObjectURL(url);
        setDlAllState("idle");
        return;
      }

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setDlProgress(total > 0 ? Math.round((received / total) * 100) : -1);
      }

      const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "manifests.zip"; a.click();
      URL.revokeObjectURL(url);
      setDlAllState("idle");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setDlAllState("error");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  // Auto-dismiss error after 4s
  useEffect(() => {
    if (dlAllState !== "error") return;
    const t = setTimeout(() => setDlAllState("idle"), 4000);
    return () => clearTimeout(t);
  }, [dlAllState]);

  const haystackFn = useCallback(
    (g: ManifestTitleGroup) =>
      `${g.display_name} ${g.app_name} ${g.build_versions.join(" ")} ${g.entries
        .map((e) => e.effective_id)
        .join(" ")}`,
    []
  );
  const filtered = useFilteredGames(data?.games ?? [], query, haystackFn);

  // Flatten filtered groups into a single list of {entry, group} for pagination,
  // applying the file_type and counterpart filters at the same time so groups
  // with no matching entries drop out entirely.
  const flatEntries = useMemo<FlatEntry[]>(
    () =>
      filtered.flatMap((group) =>
        group.entries
          .filter((entry) => {
            if (filters.fileType !== FILE_TYPE_FILTER.ALL && entry.file_type !== filters.fileType) return false;
            if (filters.counterpart !== COUNTERPART_FILTER.ALL) {
              const { tier1, tier2 } = findRelated(entry, group);
              switch (filters.counterpart) {
                case COUNTERPART_FILTER.MATCHING: return tier1.length > 0;
                case COUNTERPART_FILTER.RELATED: return tier2.length > 0 && tier1.length === 0;
                case COUNTERPART_FILTER.BOTH: return tier1.length > 0 || tier2.length > 0;
              }
            }
            return true;
          })
          .map((entry) => ({ entry, group }))
      ),
    [filtered, filters.fileType, filters.counterpart]
  );

  // Sort the flat entries per the user's sort selection.
  const sortedEntries = useMemo(() => {
    const arr = [...flatEntries];
    const dir = filters.sortDir === SORT_DIR.ASC ? 1 : -1;
    const cmp = (a: FlatEntry, b: FlatEntry): number => {
      switch (filters.sortBy) {
        case SORT_BY.EFFECTIVE_ID:
          return a.entry.effective_id.localeCompare(b.entry.effective_id) * dir;
        case SORT_BY.BUILD_VERSION:
          return (a.entry.build_version || "").localeCompare(b.entry.build_version || "") * dir;
        case SORT_BY.APP_NAME:
          return a.group.app_name.localeCompare(b.group.app_name) * dir;
        case SORT_BY.UPLOADED_AT:
        default:
          return (
            (new Date(a.entry.uploaded_at).getTime() -
              new Date(b.entry.uploaded_at).getTime()) *
            dir
          );
      }
    };
    return arr.sort(cmp);
  }, [flatEntries, filters.sortBy, filters.sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedEntries.length / filters.pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageEntries = useMemo(
    () => sortedEntries.slice(safePage * filters.pageSize, (safePage + 1) * filters.pageSize),
    [sortedEntries, safePage, filters.pageSize]
  );

  // Reset to first page when search query or sort/page-size changes.
  const onQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(0);
  }, []);
  const onFiltersChange = useCallback((next: Partial<ManifestFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(0);
  }, []);

  const handleUploadSuccess = useCallback(() => { refetch(); }, [refetch]);
  const handleSelect = useCallback((entry: ManifestTitleEntry, group: ManifestTitleGroup) => {
    navigate(`/manifests/${encodeURIComponent(group.app_name)}/${encodeURIComponent(entry.effective_id)}`);
  }, [navigate]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Manifest Browser</h1>
          <p className="mt-2 text-base text-[var(--color-text-muted)]">
            Browse every manifest stored in the Epic-Unlocker database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary !py-2 !px-4 !text-sm"
            title="Upload a manifest file"
          >
            <span aria-hidden>⬆</span> Upload
          </button>
          <button
            onClick={dlAllState === "loading" ? () => abortRef.current?.abort() : handleDownloadAll}
            className={`btn-outline !py-2 !px-4 !text-sm ${dlAllState === "loading" ? "!border-amber-500/50 !text-amber-400" : dlAllState === "error" ? "!border-red-500/50 !text-red-400" : ""}`}
            title={dlAllState === "loading" ? "Cancel download" : "Download all manifests as ZIP"}
          >
            {dlAllState === "loading" ? (
              <>
                <span className="inline-block w-3.5 text-center">⏳</span>{" "}
                {dlProgress > 0 ? `${dlProgress}%` : "..."}
              </>
            ) : dlAllState === "error" ? (
              <>
                <span>⚠</span>{" "}Failed
              </>
            ) : (
              <>
                <span aria-hidden>⬇</span> Download All
              </>
            )}
          </button>
          <button
            onClick={() => refetch()}
            className="btn-outline"
            title="Refresh /titles"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <GameStats />

      <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <GameSearch value={query} onChange={onQueryChange} />
        <ManifestFilters state={filters} onChange={onFiltersChange} />
      </div>

      <div className="mb-3 text-base text-[var(--color-text-muted)]">
        {filtered.length} of {data?.games.length ?? 0} games ·{" "}
        {sortedEntries.length} entries
      </div>

      {isLoading && <GameGridSkeleton count={6} />}
      {error && <ErrorBlock message={(error as Error).message} />}
      {!isLoading && !error && sortedEntries.length === 0 && (
        <EmptyState
          title="No manifests found"
          hint={
            data?.games.length
              ? "Try a different search term."
              : "Upload some manifests to the backend first."
          }
        />
      )}

      {!isLoading && !error && sortedEntries.length > 0 && (
        <div className="flex flex-col gap-5">
          <ManifestCardGrid
            entries={pageEntries}
            onSelect={handleSelect}
            selected={null}
          />
          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={sortedEntries.length}
            pageSize={filters.pageSize}
            onChange={setPage}
          />
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
